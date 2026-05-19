const { Telegraf } = require('telegraf');

// Bot tokeni Vercel-dəki Environment Variables-dən avtomatik oxunur
const bot = new Telegraf(process.env.BOT_TOKEN);

// ⚠️ ÇOX VACİB: Öz botunun istifadəçi adını bura yaz (Qarşısında @ işarəsi OLMADAN!)
// Məsələn: "Bearbee_bot" və ya "Bearbeee_bot"
const BOT_USERNAME = "Bearbeee_bot"; 

// Şəkil linki
const photoUrl = "https://i.postimg.cc/wTRTSB4s/Screenshot-20260519-031203-Google.jpg";

// Start komandası
bot.command('start', async (ctx) => {
  try {
    const userId = ctx.from.id;
    
    // 1. Şəxsi referal linki (Artıq çökme ehtimalı sıfırdır)
    const referralLink = `https://t.me/${BOT_USERNAME}?start=${userId}`;
    
    // 2. Kiminsə linki ilə gəlib-gəlmədiyini tuturuq (Payload)
    const invitedBy = ctx.payload;

    if (invitedBy && invitedBy !== String(userId)) {
      console.log(`İstifadəçi ${userId}, ${invitedBy} tərəfindən dəvət edildi.`);
    }

    // 3. Mini App URL-i (Referal parametrin tətbiqə ötürülməsi)
    const miniAppUrl = `https://xeyalamanov121-commits.github.io/Bearbee/?tgWebAppStartParam=${invitedBy || 'none'}`;

    // 4. HTML Formatına keçdik (Ulduzlar və alt xətlər artıq heç bir xəta yaratmayacaq)
    const captionText = 
      "🏎️ <b>BEARBEE RACING IS READY!</b> 🏎️\n\n" +
      "4 players, 1 goal! Join the lobby and start racing now.\n\n" +
      `🔗 <b>Sizin Dəvət Linkiniz:</b>\n${referralLink}\n\n` +
      "🔥 <b>Click the button below to play the game:</b>";

    // Şəkilli mesajı və düyməni göndəririk
    await ctx.replyWithPhoto(photoUrl, {
      caption: captionText,
      parse_mode: 'HTML', // HTML parse_mode hər zaman daha stabil işləyir
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
