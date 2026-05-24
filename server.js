const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server, {
    cors: { origin: "*" }
});

app.use(express.json());

// 1. Kök ünvan üçün cavab (Cannot GET / xətasını aradan qaldırır)
app.get('/', (req, res) => {
    res.send('Bearbee Serveri aktivdir və yarışa hazırdır! 🐝');
});

// CONFIG
const ADMIN_ID = "8591374417"; 

let databaseMock = {}; 
let matchmakingQueue = []; 
let activeRaceRooms = {};   

// API Endpoints
app.get('/api/user/:id', (req, res) => {
    const uId = req.params.id;
    if (!databaseMock[uId]) {
        databaseMock[uId] = { honey: 0, level: 1, energy: 100, ton_balance: 0.0, deposit_balance: 0.0, reklam_baxis: 0 };
    }
    res.json(databaseMock[uId]);
});

app.post('/api/user/sync', (req, res) => {
    const { user_id, honey, level, energy, ton_balance, deposit_balance, reklam_baxis } = req.body;
    if (user_id) {
        databaseMock[user_id] = {
            honey: parseInt(honey) || 0,
            level: parseInt(level) || 1,
            energy: parseInt(energy) || 100,
            ton_balance: parseFloat(ton_balance) || 0.0,
            deposit_balance: parseFloat(deposit_balance) || 0.0,
            reklam_baxis: parseInt(reklam_baxis) || 0
        };
    }
    res.json({ success: true });
});

// MULTIPLAYER WEBSOCKET
io.on('connection', (socket) => {
    console.log(`📡 Yeni cihaz qoşuldu: ${socket.id}`);

    socket.on('find_match', (userData) => {
        const isAlreadyInQueue = matchmakingQueue.some(p => p.user_id === userData.user_id);
        
        if (!isAlreadyInQueue) {
            matchmakingQueue.push({
                socketId: socket.id,
                user_id: userData.user_id,
                username: userData.username,
                x: 0
            });
        }

        matchmakingQueue.forEach(player => {
            io.to(player.socketId).emit('match_room_update', {
                currentPlayers: matchmakingQueue.length
            });
        });

        if (matchmakingQueue.length >= 2 || matchmakingQueue.some(p => p.user_id == ADMIN_ID)) {
            const roomId = 'cyber_room_' + Math.floor(100000 + Math.random() * 900000);
            activeRaceRooms[roomId] = { players: {}, gameStarted: false };

            matchmakingQueue.forEach(player => {
                activeRaceRooms[roomId].players[player.user_id] = { socketId: player.socketId, name: player.username, x: 0 };
                const playerSocket = io.sockets.sockets.get(player.socketId);
                if (playerSocket) playerSocket.join(roomId);
            });

            matchmakingQueue = [];
            io.to(roomId).emit('match_start', { roomId: roomId });
            setTimeout(() => startRaceCountdown(roomId), 2000);
        }
    });

    socket.on('gas_press', (data) => {
        const room = activeRaceRooms[data.room];
        if (!room || !room.gameStarted) return;
        const player = room.players[data.userId];
        if (player) {
            player.x += 2.5; 
            io.to(data.room).emit('race_state_update', { players: room.players });
            if (player.x >= 100) {
                io.to(data.room).emit('race_finished', { winnerId: data.userId, winnerName: player.name });
                delete activeRaceRooms[data.room];
            }
        }
    });

    socket.on('disconnect', () => {
        matchmakingQueue = matchmakingQueue.filter(p => p.socketId !== socket.id);
        console.log(`🔌 Cihaz ayrıldı: ${socket.id}`);
    });
});

function startRaceCountdown(roomId) {
    let count = 3;
    const interval = setInterval(() => {
        if (!activeRaceRooms[roomId]) { clearInterval(interval); return; }
        io.to(roomId).emit('race_countdown', count);
        if (count === 0) { activeRaceRooms[roomId].gameStarted = true; clearInterval(interval); }
        count--;
    }, 1000);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server ${PORT} portunda aktivdir!`);
});

