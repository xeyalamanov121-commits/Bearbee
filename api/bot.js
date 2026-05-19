const { Telegraf } = require('telegraf');
const admin = require('firebase-admin');

// Firebase-i Vercel-dəki ayrı dəyişənlərlə başlat
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Vercel-dən gələn private key-dəki \n simvollarını düzəldirik
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
    }),
  });
}
const db = admin.firestore();

const bot = new Telegraf(process.env.BOT_TOKEN);
const BOT_USERNAME = "Bearbeee_bot"; 
// ADMIN_ID-ni də Vercel-dən oxuyaq
const ADMIN_ID = process.env.ADMIN_CHAT_ID; 

const photoUrl = "https://i.postimg.cc/wTRTSB4s/Screenshot-20260519-031203-Google.jpg";

// Start komandası (Referal sistemi ilə)
bot.command('start', async (ctx) => {
  try {
    const userId = ctx.from.id.toString();
    const referrerId = ctx.payload; 

    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      await userRef.set({ 
        balance: 0, 
        referrals: 0, 
        username: ctx.from.username || 'Guest' 
      });

      if (referrerId && referrerId !== userId) {
        const referrerRef = db.collection('users').doc(referrerId);
        // İstifadəçinin bazada olub olmadığını yoxlayırıq ki xəta verməsin
        const referrerDoc = await referrerRef.get();
        if (referrerDoc.exists) {
          await referrerRef.update({
            balance: admin.firestore.FieldValue.increment(100)
          });
          await ctx.telegram.sendMessage(referrerId, "🎉 <b>Təbriklər!</b> Yeni bir dost dəvət etdin və 100 bal qazandın!", { parse_mode: 'HTML' });
        }
      }
    }

    const miniAppUrl = `https://xeyalamanov121-commits.github.io/Bearbee/?tgWebAppStartParam=${ctx.payload || 'none'}`;
    const welcomeText = "🏎️ <b>BEARBEE RACING-ə xoş gəlmisiniz!</b> 🏎️\n\nYarışa başlamaq üçün aşağıdakı menyudan istifadə edin.";

    await ctx.replyWithPhoto(photoUrl, {
      caption: welcomeText,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: "🏎️ Oyuna Başla", web_app: { url: miniAppUrl } }],
          [
            { text: "🔗 Dəvət Linkim", callback_data: 'get_referral' },
            { text: "💬 Adminlə Danış", callback_data: 'support_mode' }
          ]
        ]
      }
    });
  } catch (error) {
    console.error("Start xətası:", error);
  }
});

// Callback və Mesaj sistemi (Dəyişilməz qaldı)
bot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery.data;
  await ctx.answerCbQuery();
  if (data === 'get_referral') {
    const referralLink = `https://t.me/${BOT_USERNAME}?start=${ctx.from.id}`;
    await ctx.reply(`🔗 <b>Sizin şəxsi dəvət linkiniz:</b>\n<code>${referralLink}</code>`, { parse_mode: 'HTML' });
  } else if (data === 'support_mode') {
    await ctx.reply("💬 <b>Dəstək rejimi aktivdir.</b>\nİstədiyiniz sualı bura yazın.", { parse_mode: 'HTML' });
  }
});

bot.on('message', async (ctx) => {
  if (!ctx.message.text) return;
  const userId = ctx.from.id;
  const text = ctx.message.text;

  if (userId == ADMIN_ID && ctx.message.reply_to_message) {
    const replyText = ctx.message.reply_to_message.text || "";
    const match = replyText.match(/ID: (\d+)/);
    if (match) {
      await ctx.telegram.sendMessage(match[1], `💬 <b>Admindən cavab:</b>\n\n${text}`, { parse_mode: 'HTML' });
      await ctx.reply("✅ Mesaj istifadəçiyə çatdı.");
    }
    return;
  }
  if (userId != ADMIN_ID) {
    await ctx.telegram.sendMessage(ADMIN_ID, `📩 <b>Yeni Mesaj!</b>\n👤 <b>İstifadəçi:</b> @${ctx.from.username || 'Gizli'}\n🆔 <b>ID:</b> ${userId}\n\n📝 <b>Mesaj:</b> ${text}`, { parse_mode: 'HTML' });
    await ctx.reply("📨 Mesajınız adminə göndərildi.");
  }
});

module.exports = async (req, res) => {
  try {
    if (req.method === 'POST') {
      await bot.handleUpdate(req.body, res);
    } else {
      res.status(200).send('Bot aktivdir!');
    }
  } catch (err) {
    console.error(err);
    res.status(200).send('Xəta baş verdi.');
  }
};
