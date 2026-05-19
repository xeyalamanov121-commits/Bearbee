const { Telegraf } = require('telegraf');
const admin = require('firebase-admin');

// 1. Firebase-i etibarlı şəkildə başlat
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}
const db = admin.firestore();

// 2. Botu başlat
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.command('start', async (ctx) => {
    // Referal sistemi üçün sadə məntiq
    const userId = ctx.from.id.toString();
    const userRef = db.collection('users').doc(userId);
    
    // İstifadəçini bazaya qeyd et
    await userRef.set({ username: ctx.from.username || 'Guest' }, { merge: true });
    
    await ctx.reply("🏎️ BEARBEE RACING-ə xoş gəlmisiniz!");
});

// 3. Vercel üçün eksport
module.exports = async (req, res) => {
    try {
        if (req.method === 'POST') {
            await bot.handleUpdate(req.body);
            return res.status(200).send('OK');
        }
        res.status(200).send('Bot aktivdir.');
    } catch (err) {
        console.error("Webhook xətası:", err);
        res.status(200).send('Xəta baş verdi');
    }
};
