const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let players = {};

io.on('connection', (socket) => {
    socket.on('joinGame', (userData) => {
        players[socket.id] = { id: socket.id, username: userData.username, x: 50, score: 0, isDead: false };
        io.emit('updatePlayers', players);
    });

    socket.on('move', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            socket.broadcast.emit('playerMoved', { id: socket.id, x: data.x });
        }
    });

    socket.on('updateScore', (score) => {
        if (players[socket.id]) {
            players[socket.id].score = score;
        }
    });

    socket.on('playerDied', () => {
        if (players[socket.id]) {
            players[socket.id].isDead = true;
            io.emit('playerExploded', socket.id);
            
            // Hamı öldüsə qalibi elan et
            let allDead = Object.values(players).every(p => p.isDead);
            if (allDead) {
                let winner = null;
                let maxScore = -1;
                Object.values(players).forEach(p => {
                    if (p.score > maxScore) { maxScore = p.score; winner = p.username; }
                });
                io.emit('gameResult', `QALİB: ${winner} (${maxScore} xal)`);
            }
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('playerLeft', socket.id);
    });
});

server.listen(process.env.PORT || 3000);
