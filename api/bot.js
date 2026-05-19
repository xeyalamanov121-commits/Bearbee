const { Telegraf } = require('telegraf');
const admin = require('firebase-admin');

// 1. Firebase-i başlat (əgər hələ başlamayıbsa)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_CONFIG))
    });
}
const db = admin.firestore();

// 2. Botu burada, funksiyadan kənarda təyin et
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.command('start', async (ctx) => {
    await ctx.reply("🏎️ BEARBEE RACING-ə xoş gəlmisiniz!");
});

// 3. Vercel üçün əsas eksport funksiyası
module.exports = async (req, res) => {
    try {
        if (req.method === 'POST') {
            await bot.handleUpdate(req.body);
            return res.status(200).send('OK');
        } else {
            return res.status(200).send('Bot aktivdir.');
        }
    } catch (err) {
        console.error("Webhook xətası:", err);
        return res.status(200).send('Xəta baş verdi');
    }
};
