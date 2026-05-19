const { Telegraf } = require('telegraf');

// BOT_TOKEN-in Vercel-də "Environment Variables" bölməsində olduğundan əmin ol
const bot = new Telegraf(process.env.BOT_TOKEN);

const BOT_USERNAME = "Bearbeee_bot"; 
const ADMIN_ID = 8591374417; // Sənin ID-n

const photoUrl = "https://i.postimg.cc/wTRTSB4s/Screenshot-20260519-031203-Google.jpg";

// Start komandası
bot.command('start', async (ctx) => {
  try {
    const miniAppUrl = `https://xeyalamanov121-commits.github.io/Bearbee/?tgWebAppStartParam=${ctx.payload || 'none'}`;
    
    const welcomeText = 
      "🏎️ <b>BEARBEE RACING-ə xoş gəlmisiniz!</b> 🏎️\n\n" +
      "Yarışa başlamaq və ya bizimlə əlaqə saxlamaq üçün aşağıdakı menyudan istifadə edin.";

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

// Düymə hərəkətləri (Daha stabil versiya)
bot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery.data;
  await ctx.answerCbQuery(); // Dairəni dayandırır

  if (data === 'get_referral') {
    const referralLink = `https://t.me/${BOT_USERNAME}?start=${ctx.from.id}`;
    await ctx.reply(`🔗 <b>Sizin şəxsi dəvət linkiniz:</b>\n<code>${referralLink}</code>`, { parse_mode: 'HTML' });
  } else if (data === 'support_mode') {
    await ctx.reply("💬 <b>Dəstək rejimi aktivdir.</b>\n\nİstədiyiniz sualı bura yazın, adminə göndəriləcək.", { parse_mode: 'HTML' });
  }
});

// Mesajlaşma sistemi
bot.on('message', async (ctx) => {
  if (!ctx.message.text) return;
  
  const userId = ctx.from.id;
  const text = ctx.message.text;

  // Admin cavab verirsə
  if (userId == ADMIN_ID && ctx.message.reply_to_message) {
    const replyText = ctx.message.reply_to_message.text || "";
    const match = replyText.match(/ID: (\d+)/);
    if (match) {
      await ctx.telegram.sendMessage(match[1], `💬 <b>Admindən cavab:</b>\n\n${text}`, { parse_mode: 'HTML' });
      await ctx.reply("✅ Mesaj istifadəçiyə çatdı.");
    }
    return;
  }

  // İstifadəçi adminə yazırsa
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
    res.status(200).send('Xəta baş verdi, lakin server işləyir.');
  }
};
