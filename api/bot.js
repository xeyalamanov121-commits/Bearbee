const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

// ⚠️ VACİB: Öz məlumatlarını bura yaz
const BOT_USERNAME = "Bearbeee_bot"; 
const ADMIN_ID = 123456789; // Öz Telegram ID-ni bura yaz!

const photoUrl = "https://i.postimg.cc/wTRTSB4s/Screenshot-20260519-031203-Google.jpg";

// Start komandası (Düyməli Menyu ilə)
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

// Düymə hərəkətləri
bot.action('get_referral', async (ctx) => {
  const referralLink = `https://t.me/${BOT_USERNAME}?start=${ctx.from.id}`;
  await ctx.answerCbQuery();
  await ctx.reply(`🔗 <b>Sizin şəxsi dəvət linkiniz:</b>\n<code>${referralLink}</code>`, { parse_mode: 'HTML' });
});

bot.action('support_mode', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply("💬 <b>Dəstək rejimi aktivdir.</b>\n\nİstədiyiniz sualı bura yazın, adminə göndəriləcək.", { parse_mode: 'HTML' });
});

// Mesajlaşma sistemi
bot.on('message', async (ctx) => {
  const userId = ctx.from.id;
  const text = ctx.message.text;

  // Admin cavab verirsə
  if (userId === ADMIN_ID && ctx.message.reply_to_message) {
    const replyText = ctx.message.reply_to_message.text;
    const match = replyText.match(/ID: (\d+)/);
    if (match) {
      await ctx.telegram.sendMessage(match[1], `💬 <b>Admindən cavab:</b>\n\n${text}`, { parse_mode: 'HTML' });
      await ctx.reply("✅ Mesaj istifadəçiyə çatdı.");
    }
    return;
  }

  // İstifadəçi adminə yazırsa
  if (userId !== ADMIN_ID) {
    await ctx.telegram.sendMessage(ADMIN_ID, `📩 <b>Yeni Mesaj!</b>\n👤 <b>İstifadəçi:</b> @${ctx.from.username || 'Gizli'}\n🆔 <b>ID:</b> ${userId}\n\n📝 <b>Mesaj:</b> ${text}`, { parse_mode: 'HTML' });
    await ctx.reply("📨 Mesajınız adminə göndərildi.");
  }
});

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    await bot.handleUpdate(req.body);
    res.status(200).send('OK');
  } else {
    res.status(200).send('Bot aktivdir!');
  }
};
