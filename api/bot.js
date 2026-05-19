const { Telegraf } = require('telegraf');
const admin = require('firebase-admin');

// Firebase-i birbaşa sertifikat obyektinə çevirərək başlatırıq
if (!admin.apps.length) {
  try {
    // Əgər FIREBASE_CONFIG JSON-dursa, onu birbaşa çeviririk
    const config = typeof process.env.FIREBASE_CONFIG === 'string' 
      ? JSON.parse(process.env.FIREBASE_CONFIG) 
      : process.env.FIREBASE_CONFIG;

    admin.initializeApp({
      credential: admin.credential.cert(config)
    });
    console.log("Firebase uğurla başladı!");
  } catch (error) {
    console.error("Firebase başlama xətası:", error.message);
  }
}

const db = admin.firestore();
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.command('start', async (ctx) => {
  try {
    const userId = ctx.from.id.toString();
    await db.collection('users').doc(userId).set({ 
      balance: 0, 
      username: ctx.from.username || 'Guest' 
    }, { merge: true });
    
    await ctx.reply("🏎️ BEARBEE RACING-ə xoş gəlmisiniz!");
  } catch (err) {
    console.error(err);
  }
});

module.exports = async (req, res) => {
  try {
    await bot.handleUpdate(req.body, res);
  } catch (err) {
    res.status(200).send('OK');
  }
};

