// Start komandasında referal yoxlanışı
bot.command('start', async (ctx) => {
    const userId = ctx.from.id.toString();
    const payload = ctx.payload; // Referal ID-ni götürür

    // 1. İstifadəçini bazaya əlavə et (əgər yoxdursa)
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        await userRef.set({ balance: 0, username: ctx.from.username || 'Guest' });
        
        // 2. Əgər referal linki ilə gəlibsə, 100 xal əlavə et
        if (payload && payload !== userId) {
            const referrerRef = db.collection('users').doc(payload);
            await referrerRef.update({
                balance: admin.firestore.FieldValue.increment(100)
            });
            // Dəvət edənə xəbər ver (opsional)
            try {
                await bot.telegram.sendMessage(payload, "🎉 Yeni referal gəldi! Balansınıza 100 xal əlavə olundu.");
            } catch (e) {}
        }
    }

    // 3. Menyunu göstər
    await ctx.reply("🏎️ BEARBEE RACING-ə xoş gəlmisiniz!", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🏎️ Oyuna Başla", web_app: { url: "https://xeyalamanov121-commits.github.io/Bearbee/" } }],
                [{ text: "🔗 Dəvət Linkim", callback_data: 'get_referral' }]
            ]
        }
    });
});
