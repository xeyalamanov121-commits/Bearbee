const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let rooms = {};

io.on('connection', (socket) => {
    socket.on('joinGame', (data) => {
        let roomName = Object.keys(rooms).find(r => rooms[r].players.length < 2 && rooms[r].status === 'waiting') || `room_${Date.now()}`;
        if (!rooms[roomName]) rooms[roomName] = { players: [], status: 'waiting' };
        
        socket.join(roomName);
        socket.room = roomName;
        rooms[roomName].players.push({ id: socket.id, username: data.username, score: 0, isDead: false });
        
        io.to(roomName).emit('roomUpdate', rooms[roomName].players.length);
        
        if (rooms[roomName].players.length === 2) {
            rooms[roomName].status = 'playing';
            io.to(roomName).emit('gameStarted');
        }
    });

    socket.on('updateScore', (score) => {
        if (socket.room && rooms[socket.room]) {
            let p = rooms[socket.room].players.find(x => x.id === socket.id);
            if (p) p.score = score;
        }
    });

    socket.on('playerDied', () => {
        if (socket.room && rooms[socket.room]) {
            let p = rooms[socket.room].players.find(x => x.id === socket.id);
            p.isDead = true;
            io.to(socket.room).emit('playerExploded', socket.id);
            
            if (rooms[socket.room].players.every(x => x.isDead)) {
                let winner = rooms[socket.room].players.reduce((prev, curr) => (prev.score > curr.score) ? prev : curr);
                io.to(socket.room).emit('gameResult', `🏆 QALİB: ${winner.username} (${winner.score} xal)!`);
                delete rooms[socket.room];
            }
        }
    });
});

server.listen(3000);
