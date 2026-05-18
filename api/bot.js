const { Telegraf } = require('telegraf');
const bot = new Telegraf(process.env.BOT_TOKEN);

// Şəkil və mətn
const photoUrl = "https://i.postimg.cc/wTRTSB4s/Screenshot-20260519-031203-Google.jpg";
const captionText = 
  "🏎️ **THE BIG RACE IS STARTING!** 🏎️\n\n" +
  "4 racers, 1 champion! Will it be you?\n" +
  "🏁 **Lobby Status:** Waiting for racers to join...\n\n" +
  "🔥 **Click the button below to join the race:**";

// Start əmri
bot.command('start', async (ctx) => {
  await ctx.replyWithPhoto(photoUrl, {
    caption: captionText,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: "Join 4-Player Race 🏎️💨", url: "https://bearbee.vercel.app/" }]
      ]
    }
  });
});

// Vercel üçün Webhook handler
export default async function handler(req, res) {
  try {
    await bot.handleUpdate(req.body);
    res.status(200).send('OK');
  } catch (error) {
    res.status(500).send('Error');
  }
}

