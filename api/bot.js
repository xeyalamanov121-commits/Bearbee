const { Telegraf } = require('telegraf');
const admin = require('firebase-admin');

// 1. Firebase-in başladılması
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}
const db = admin.firestore();

// 2. Botu başlat
const bot = new Telegraf(process.env.BOT_TOKEN);

// 3. Start əmri və ana menyu (Web App inteqrasiyası ilə)
bot.command('start', async (ctx) => {
    const userId = ctx.from.id.toString();
    const gameUrl = 'https://xeyalamanov121-commits.github.io/Bearbee/';
    
    // İstifadəçini bazaya əlavə et
    await db.collection('users').doc(userId).set({ 
        username: ctx.from.username || 'Guest',
        points: 0,
        honeyLevel: 0
    }, { merge: true });

    const keyboard = {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🏎️ PLAY NOW (Mini App)", web_app: { url: gameUrl } }],
                [
                    { text: "🍯 Feed Bee", callback_data: 'feed_bee' },
                    { text: "📊 My Points", callback_data: 'check_points' }
                ],
                [{ text: "🎁 Invite Friends (+100 pts)", callback_data: 'get_referral' }]
            ]
        }
    };

    const summary = `🐻 **BEARBEE RACING - Quick Guide**\n\n🏎️ **Race:** Compete in high-speed tracks.\n🐝 **Feed Bee:** Keep your bee happy for bonus points.\n🎁 **Referral:** Invite friends and earn 100 points!`;

    try {
        await ctx.replyWithPhoto('https://i.ibb.co/XfYH8FtQ/Screenshot-20260519-031203-Google.jpg', {
            caption: summary,
            parse_mode: 'Markdown',
            ...keyboard
        });
    } catch (e) {
        await ctx.reply(summary, { parse_mode: 'Markdown', ...keyboard });
    }
});

// 4. Düymə funksiyaları
bot.action('feed_bee', async (ctx) => {
    await db.collection('users').doc(ctx.from.id.toString()).update({ 
        honeyLevel: admin.firestore.FieldValue.increment(10) 
    });
    await ctx.answerCbQuery("Arı xoşbəxt oldu! +10 bal.");
});

bot.action('check_points', async (ctx) => {
    const doc = await db.collection('users').doc(ctx.from.id.toString()).get();
    const data = doc.data();
    await ctx.answerCbQuery();
    await ctx.reply(`📊 Sənin xalın: ${data.points}\n🍯 Arının bal səviyyəsi: ${data.honeyLevel || 0}`);
});

bot.action('get_referral', async (ctx) => {
    // Burada botunun istifadəçi adını dəyişməyi unutma
    const link = `https://t.me/SeninBotununIstifadeciAdi?start=${ctx.from.id}`;
    await ctx.answerCbQuery();
    await ctx.reply(`🎁 Dostlarını dəvət et!\n\nLinkin:\n${link}`);
});

// 5. Vercel eksportu
module.exports = async (req, res) => {
    try {
        if (req.method === 'POST') {
            await bot.handleUpdate(req.body);
            return res.status(200).send('OK');
        }
        res.status(200).send('Bot aktivdir.');
    } catch (err) {
        console.error("Webhook xətası:", err);
        return res.status(200).send('Xəta baş verdi');
    }
};
