const { Telegraf } = require('telegraf');

// Bot tokeni Vercel-dəki Environment Variables-dən avtomatik oxunur
const bot = new Telegraf(process.env.BOT_TOKEN);

// Şəkil linki
const photoUrl = "https://i.postimg.cc/wTRTSB4s/Screenshot-20260519-031203-Google.jpg";

// Start komandası
bot.command('start', async (ctx) => {
  try {
    const userId = ctx.from.id;
    const botUsername = ctx.botInfo.username;
    
    // 1. İstifadəçinin öz şəxsi referal linki
    const referralLink = `https://t.me/${botUsername}?start=${userId}`;
    
    // 2. Kiminsə linki ilə gəlib-gəlmədiyini tuturuq (Payload)
    const invitedBy = ctx.payload;

    if (invitedBy && invitedBy !== String(userId)) {
      console.log(`İstifadəçi ${userId}, ${invitedBy} tərəfindən dəvət edildi.`);
      // Əgər verilənlər bazan (Supabase/Firebase) bu fayla qoşuludursa,
      // burada invitedBy ID-li şəxsə bonus xal yaza bilərsən.
    }

    // 3. Mini App URL-i (Referal parametrin tətbiqə ötürülməsi)
    const miniAppUrl = `https://xeyalamanov121-commits.github.io/Bearbee/?tgWebAppStartParam=${invitedBy || 'none'}`;

    // Dinamik Elan mətni (Referal linki daxil edilmiş versiya)
    const captionText = 
      "🏎️ **BEARBEE RACING IS READY!** 🏎️\n\n" +
      "4 players, 1 goal! Join the lobby and start racing now.\n\n" +
      `🔗 **Sizin Dəvət Linkiniz:**\n${referralLink}\n\n` +
      "🔥 **Click the button below to play the game:**";

    // Şəkilli mesajı və düyməni göndəririk
    await ctx.replyWithPhoto(photoUrl, {
      caption: captionText,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { 
              text: "Play Game 🏎️💨", 
              web_app: { url: miniAppUrl } 
            }
          ]
        ]
      }
    });
  } catch (error) {
    console.error("Mesaj göndərilərkən xəta baş verdi:", error);
  }
});

// Vercel Serverless funksiyası (Webhook handler)
module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      await bot.handleUpdate(req.body);
      res.status(200).send('OK');
    } catch (error) {
      console.error("Webhook xətası:", error);
      res.status(500).send('Server xətası');
    }
  } else {
    res.status(200).send('Bot aktivdir!');
  }
};
