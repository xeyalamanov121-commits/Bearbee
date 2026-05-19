bot.command('start', async (ctx) => {
    const gameUrl = 'https://xeyalamanov121-commits.github.io/Bearbee/';

    const keyboard = {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🏎️ OYUNA GİRİŞ", url: gameUrl }],
                [
                    { text: "🍯 Arını Yedizdir", callback_data: 'feed_bee' },
                    { text: "📊 Xallarım", callback_data: 'check_points' }
                ]
            ]
        }
    };

    const summary = `
🐻 **BEARBEE RACING - Oyun Xülasəsi:**

🏎️ **Yarış:** Dünyanın ən sürətli ayısı olmaq üçün maneələri aş və lider ol!
🐝 **Arını Yedizdir:** Arını doyuraraq xüsusi bonuslar və xallar qazan.
🎁 **Referal:** Dostlarını dəvət et, 100 bal qazan!

*Aşağıdakı düymələrdən istifadə edərək oyuna başla və ya arını idarə et:*
    `;

    await ctx.replyWithPhoto('https://i.imgur.com/SENIN_SEKLIN.jpg', {
        caption: summary,
        parse_mode: 'Markdown',
        ...keyboard
    });
});
