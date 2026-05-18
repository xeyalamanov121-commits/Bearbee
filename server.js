const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server, {
    cors: { origin: "*" } // Bütün cihazlardan gələn sorğulara icazə verilir
});

app.use(express.json());

// Verilənlər bazası olmadıqda anlıq statistikanı yaddaşda saxlamaq üçün obyekt (Daimi aktiv qalan serverlər üçün)
let databaseMock = {}; 
let matchmakingQueue = []; // Yarış üçün növbədə gözləyənlər
let activeRaceRooms = {};   // Canlı davam edən yarış otaqları

// ==========================================
// 1. DATA SİNXRONİZASİYASI (API ENDPOINTS)
// ==========================================

// İstifadəçi məlumatlarını çəkmək
app.get('/api/user/:id', (req, res) => {
    const uId = req.params.id;
    if (!databaseMock[uId]) {
        databaseMock[uId] = { honey: 0, level: 1, energy: 100, ton_balance: 0.0, deposit_balance: 0.0, reklam_baxis: 0 };
    }
    res.json(databaseMock[uId]);
});

// İstifadəçi məlumatlarını yaddaşa yazmaq (Sync)
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

// ==========================================
// 2. MULTIPLAYER WEBSOCKET (SOCKET.IO) İDURƏSİ
// ==========================================

io.on('connection', (socket) => {
    console.log(`📡 Yeni cihaz qoşuldu: ${socket.id}`);

    // Oyunçu "Yarışı Başlat" düyməsinə klikləyəndə növbəyə alınır
    socket.on('find_match', (userData) => {
        const isAlreadyInQueue = matchmakingQueue.some(p => p.user_id === userData.user_id);
        
        if (!isAlreadyInQueue) {
            matchmakingQueue.push({
                socketId: socket.id,
                user_id: userData.user_id,
                username: userData.username,
                x: 0
            });
            console.log(`🏎️ Növbəyə qoşuldu: @${userData.username}`);
        }

        // Növbədə gözləyən hər kəsə anlıq say yenilənməsini göndəririk
        matchmakingQueue.forEach(player => {
            io.to(player.socketId).emit('match_room_update', {
                currentPlayers: matchmakingQueue.length
            });
        });

        // 🔥 DƏQİQ 4 NƏFƏR TAMAMLANDI! YARIŞ BAŞLAYIR!
        if (matchmakingQueue.length === 4) {
            const roomId = 'cyber_room_' + Math.floor(100000 + Math.random() * 900000);
            
            activeRaceRooms[roomId] = {
                players: {},
                gameStarted: false,
                countdown: 3
            };

            // 4 oyunçunu otağa köçürürük
            matchmakingQueue.forEach(player => {
                activeRaceRooms[roomId].players[player.user_id] = {
                    socketId: player.socketId,
                    name: player.username,
                    x: 0 // Başlanğıc mövqeyi 0%
                };

                const playerSocket = io.sockets.sockets.get(player.socketId);
                if (playerSocket) playerSocket.join(roomId);
            });

            // Növbəni növbəti oyunçular üçün sıfırlayırıq
            matchmakingQueue = [];

            // Oyunçulara yarış trekinə keçid əmrini veririk
            io.to(roomId).emit('match_start', { roomId: roomId });
            
            // Geri sayımı başladırıq
            setTimeout(() => {
                startRaceCountdown(roomId);
            }, 2000);
        }
    });

    // Oyunçu vizual trek səhifəsinə (`multi_car.html`) keçəndə bura bağlanır
    socket.on('join_race_track', (data) => {
        socket.join(data.room);
        if (activeRaceRooms[data.room]) {
            io.to(data.room).emit('race_state_update', {
                players: activeRaceRooms[data.room].players
            });
        }
    });

    // "QAZA BAS" düyməsinə hər klik edildikdə maşın irəliləyir
    socket.on('gas_press', (data) => {
        const room = activeRaceRooms[data.room];
        if (!room || !room.gameStarted) return;

        const player = room.players[data.userId];
        if (player) {
            player.x += 2.5; // Hər klikdə maşın 2.5% sağa gedir

            // Yeni mövqeləri otaqdakı hamıya anlıq ötürürük (Ötüşmə vizualı)
            io.to(data.room).emit('race_state_update', { players: room.players });

            // FİNİŞ XƏTTİ (100% tapan qalib olur)
            if (player.x >= 100) {
                io.to(data.room).emit('race_finished', {
                    winnerId: data.userId,
                    winnerName: player.name
                });
                // Yarış bitdi, otağı təmizləyirik
                delete activeRaceRooms[data.room];
            }
        }
    });

    // Oyunçu oyundan çıxarsa və ya interneti kəsilərsə
    socket.on('disconnect', () => {
        matchmakingQueue = matchmakingQueue.filter(p => p.socketId !== socket.id);
        matchmakingQueue.forEach(player => {
            io.to(player.socketId).emit('match_room_update', { currentPlayers: matchmakingQueue.length });
        });
        console.log(`🔌 Cihaz ayrıldı: ${socket.id}`);
    });
});

// 3... 2... 1... START mexanikası
function startRaceCountdown(roomId) {
    let count = 3;
    const interval = setInterval(() => {
        if (!activeRaceRooms[roomId]) {
            clearInterval(interval);
            return;
        }

        io.to(roomId).emit('race_countdown', count);
        
        if (count === 0) {
            activeRaceRooms[roomId].gameStarted = true;
            clearInterval(interval);
        }
        count--;
    }, 1000);
}

// Render/Railway-ın təyin etdiyi portda və ya lokalda 3000-də işə düşür
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server ${PORT} portunda aktivdir!`);
});
