const { Telegraf } = require('telegraf');
const admin = require('firebase-admin');

// Firebase konfiqurasiyasını yoxlayırıq
if (!admin.apps.length) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (e) {
        console.error("Firebase konfiqurasiya xətası!");
    }
}

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.command('start', (ctx) => ctx.reply('Bot işlək vəziyyətdədir!'));

// Vercel serverless function
module.exports = async (req, res) => {
    try {
        if (req.method === 'POST') {
            await bot.handleUpdate(req.body);
            res.status(200).send('OK');
        } else {
            res.status(200).send('Bot aktivdir.');
        }
    } catch (err) {
        console.error("Webhook xətası:", err);
        res.status(200).send('Error');
    }
};
