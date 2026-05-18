const { Telegraf } = require('telegraf');

// Bot tokeni Vercel-dəki Environment Variables-dən avtomatik oxunur
const bot = new Telegraf(process.env.BOT_TOKEN);

// Şəkil linki
const photoUrl = "https://i.postimg.cc/wTRTSB4s/Screenshot-20260519-031203-Google.jpg";

// Elan mətni
const captionText = 
  "🏎️ **BEARBEE RACING IS READY!** 🏎️\n\n" +
  "4 players, 1 goal! Join the lobby and start racing now.\n\n" +
  "🔥 **Click the button below to play the game:**";

// Start komandası
bot.command('start', async (ctx) => {
  try {
    await ctx.replyWithPhoto(photoUrl, {
      caption: captionText,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { 
              text: "Play Game 🏎️💨", 
              web_app: { url: "https://xeyalamanov121-commits.github.io/Bearbee/" } 
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
