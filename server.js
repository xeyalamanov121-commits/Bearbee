const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();

// Təhlükəsizlik və fərqli domenlərdən (məsələn, Telegram-dan) gələn sorğuları qəbul etmək üçün CORS
app.use(cors({
    origin: "*", 
    methods: ["GET", "POST"]
}));
app.use(express.json());

const server = http.createServer(app);

// Real vaxtda Canlı Söhbət üçün WebSocket (Socket.io) tənzimlənməsi
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Müvəqqəti verilənlər bazası (Database) funksiyası - Oyunçu məlumatlarını yadda saxlayır
// Qeyd: Server sönüb yandıqda bu məlumatlar sıfırlanır. Real layihədə bura MongoDB qoşmaq məsləhətdir.
const playersDatabase = {};

// ==========================================
// 1. API ROUTELARI (Məlumatların Sinxronizasiyası)
// ==========================================

// İstifadəçi məlumatlarını bazadan oxumaq (GET)
app.get('/api/user/:id', (req, res) => {
    const userId = req.params.id;
    if (playersDatabase[userId]) {
        res.json(playersDatabase[userId]);
    } else {
        // Əgər istifadəçi ilk dəfə gəlirsə, ona ilkin balans təyin edirik
        res.json({
            honey: 0,
            level: 1,
            energy: 100,
            ton_balance: 0.0,
            deposit_balance: 0.0,
            reklam_baxis: 0
        });
    }
});

// İstifadəçi kliklədikcə və ya hərəkət etdikcə məlumatları yadda saxlayan API (POST)
app.post('/api/user/sync', (req, res) => {
    const { user_id, honey, level, energy, ton_balance, deposit_balance, reklam_baxis } = req.body;
    
    if (!user_id) {
        return res.status(400).json({ error: "İstifadəçi ID-si göndərilməyib!" });
    }

    // Məlumatları bazada yeniləyirik
    playersDatabase[user_id] = {
        honey: parseInt(honey) || 0,
        level: parseInt(level) || 1,
        energy: parseInt(energy) !== undefined ? parseInt(energy) : 100,
        ton_balance: parseFloat(ton_balance) || 0.0,
        deposit_balance: parseFloat(deposit_balance) || 0.0,
        reklam_baxis: parseInt(reklam_baxis) || 0,
        lastUpdated: new Date()
    };

    res.json({ success: true, message: "Məlumatlar uğurla sinxronizasiya edildi." });
});

// Serverin işlək olub olmadığını yoxlamaq üçün test ana səhifəsi
app.get('/', (req, res) => {
    res.send('⚡ Bearbee Cyber Empire Matrix Server is Online! ⚡');
});


// ==========================================
// 2. WEBSOCKET - CANLI SÖHBƏT (LIVE CHAT) ALQORİTMİ
// ==========================================
io.on('connection', (socket) => {
    console.log(`📡 Yeni oyunçu canlı söhbətə qoşuldu: ${socket.id}`);

    // index.html-dən mesaj gəldikdə bu funksiya işə düşür
    socket.on('send_chat_message', (data) => {
        // Gələn mesajı göndərən şəxsin özündən BAŞQA hamıya anında ötürür (Broadcast)
        socket.broadcast.emit('receive_chat_message', {
            user: data.user,
            msg: data.msg,
            id: data.id
        });
    });

    // Oyunçu oyundan və ya çatdan çıxdıqda
    socket.on('disconnect', () => {
        console.log(`❌ Oyunçu çatdan ayrıldı: ${socket.id}`);
    });
});


// Serveri işə salmaq (Məsələn: port 3000 və ya Vercel-in təyin etdiyi port)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server ${PORT} portunda uğurla işə düşdü!`);
});

