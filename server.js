const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.get('/', (req, res) => {
    res.send("Bearbee Multiplayer Serveri Aktivdir! 🚀");
});

// Aktiv oyunçuların siyahısı
let players = {};

io.on('connection', (socket) => {
    console.log(`Yeni oyunçu qoşuldu: ${socket.id}`);

    // Oyunçu yarışa daxil olduqda
    socket.on('joinGame', (userData) => {
        players[socket.id] = {
            id: socket.id,
            username: userData.username || "Oyunçu",
            x: 50, // Başlanğıc mövqe (orta yol)
            isDead: false
        };
        // Digər hər kəsə yeni oyunçunu bildir
        io.emit('updatePlayers', players);
    });

    // Oyunçu hərəkət edəndə (Sağ/Sol)
    socket.on('move', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            // Digər oyunçulara bu hərəkəti ötür
            socket.broadcast.emit('playerMoved', { id: socket.id, x: data.x });
        }
    });

    // Oyunçu maneəyə dəyib yananda
    socket.on('playerDied', () => {
        if (players[socket.id]) {
            players[socket.id].isDead = true;
            io.emit('playerExploded', socket.id);
        }
    });

    // Oyunçu oyundan çıxanda
    socket.on('disconnect', () => {
        console.log(`Oyunçu ayrıldı: ${socket.id}`);
        delete players[socket.id];
        io.emit('playerLeft', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server ${PORT} portunda işləyir...`);
});
