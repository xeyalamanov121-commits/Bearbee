const { Telegraf } = require('telegraf');
const admin = require('firebase-admin');

// Firebase-i başlat
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_CONFIG))
  });
}

const bot = new Telegraf(process.env.BOT_TOKEN);

// Start komandası
bot.command('start', async (ctx) => {
  await ctx.reply("✅ Bot artıq düzgün işləyir!");
});

// Vercel üçün əsas funksiya
module.exports = async (req, res) => {
  try {
    if (req.method === 'POST') {
      await bot.handleUpdate(req.body, res);
    } else {
      res.status(200).send('Bot aktivdir, lakin GET sorğusu qəbul edilmir.');
    }
  } catch (err) {
    console.error("Webhook xətası:", err);
    res.status(200).send('OK');
  }
};
