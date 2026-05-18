const { Telegraf } = require('telegraf');
const { MongoClient, ObjectId } = require('mongodb');

// Bot və Baza obyektlərini qlobalda saxlayırıq (Vercel-in sürətli işləməsi üçün)
const bot = new Telegraf(process.env.BOT_TOKEN);
let dbClient = null;

// Verilənlər bazasına qoşulma funksiyası
async function getDB() {
    if (!dbClient) {
        dbClient = new MongoClient(process.env.MONGO_URI);
        await dbClient.connect();
    }
    return dbClient.db();
}

// 1. ADMİNƏ DÜYMƏLİ BİLDİRİŞ GÖNDƏRƏN FUNKSİYA
async function sendAdminPanel(transaction) {
    const adminId = process.env.ADMIN_CHAT_ID;
    const message = `🔔 *Yeni Tranzaksiya Daxil Oldu!*\n\n` +
                    `👤 *İstifadəçi ID:* ${transaction.userId}\n` +
                    `🔗 *TxID (Teq):* \`${transaction.txHash}\`\n` +
                    `⏳ *Status:* Gözləmədə`;

    await bot.telegram.sendMessage(adminId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: 'Təsdiqlə ✅', callback_data: `approve_${transaction._id}` },
                    { text: 'Ləğv et ❌', callback_data: `reject_${transaction._id}` }
                ]
            ]
        }
    });
}

// 2. İSTİFADƏÇİ BOTA TXID (TEQ) GÖNDƏRDİKDƏ
bot.on('text', async (ctx) => {
    const text = ctx.message.text.trim();
    const userId = ctx.from.id;

    // Səhvən qısa mətn yazılmasının qarşısını almaq üçün
    if (text.length < 10) {
        return ctx.reply("⚠️ Lütfən düzgün bir tranzaksiya teqi (TxID) göndərin.");
    }

    try {
        const db = await getDB();
        
        // Eyni TxID-nin sistemdə olub-olmadığını yoxlayırıq (Fırıldaqçılığın qarşısını almaq üçün)
        const existingTx = await db.collection('transactions').findOne({ txHash: text });
        if (existingTx) {
            return ctx.reply("❌ Bu tranzaksiya teqi artıq sistemdə istifadə olunub!");
        }

        // Yeni tranzaksiyanı bazaya qeyd edirik
        const newTx = { 
            userId: userId, 
            txHash: text, 
            status: 'pending', 
            createdAt: new Date() 
        };
        const result = await db.collection('transactions').insertOne(newTx);
        newTx._id = result.insertedId;

        // Adminə (Sizə) təsdiq/ləğv düymələrini göndəririk
        await sendAdminPanel(newTx);
        
        ctx.reply("Tranzaksiya teqiniz qəbul olundu. Admin təsdiqi gözlənilir... ⏳");
    } catch (error) {
        console.error("Baza xətası:", error);
        ctx.reply("Sistemdə xəta baş verdi, bir az sonra yenidən yoxlayın.");
    }
});

// 3. SİZ (ADMİN) DÜYMƏLƏRDƏN BİRİNƏ BASDIQDA
bot.on('callback_query', async (ctx) => {
    const data = ctx.callbackQuery.data;
    
    if (data.startsWith('approve_') || data.startsWith('reject_')) {
        const [action, id] = data.split('_');
        const status = action === 'approve' ? 'approved' : 'rejected';
        
        try {
            const db = await getDB();
            
            // Bazada statusu yeniləyirik
            await db.collection('transactions').updateOne(
                { _id: new ObjectId(id) }, 
                { $set: { status: status } }
            );
            
            // Yenilənmiş məlumatı bazadan çəkirik
            const tx = await db.collection('transactions').findOne({ _id: new ObjectId(id) });

            // Sizin çatdakı düymələri silirik və mesajı nəticə ilə əvəzləyirik (Təkrar basılmasın)
            const resultText = status === 'approved' ? '✅ TƏSDİQLƏNDİ' : '❌ LƏĞV EDİLDİ';
            await ctx.editMessageText(
                `📋 *Tranzaksiya Nəticəsi:*\n` +
                `👤 *İstifadəçi:* ${tx.userId}\n` +
                `🔗 *TxID:* \`${tx.txHash}\`\n\n` +
                `📢 *Qərar:* ${resultText}`, 
                { parse_mode: 'Markdown' }
            );

            // İstifadəçiyə qərar barədə avtomatik mesaj göndəririk
            const userMessage = status === 'approved' 
                ? `🎉 Tranzaksiyanız (${tx.txHash}) admin tərəfindən təsdiqləndi!` 
                : `⚠️ Göndərdiyiniz tranzaksiya teqi (${tx.txHash}) keçərsiz sayıldı və admin tərəfindən ləğv edildi.`;
            
            await bot.telegram.sendMessage(tx.userId, userMessage);
            
        } catch (error) {
            console.error("Düymə işlənmə xətası:", error);
        }
    }
    // Telegram-a düymə klikinin tamamlandığını bildiririk
    await ctx.answerCbQuery();
});

// 4. VERCEL SERVERLESS İNTEQRASİYASI
module.exports = async (req, res) => {
    try {
        if (req.method === 'POST') {
            await bot.handleUpdate(req.body, res);
            res.status(200).send('OK');
        } else {
            res.status(200).send('Bot hal-hazırda aktivdir və işləyir.');
        }
    } catch (err) {
        console.error("Vercel xətası:", err);
        res.status(500).send('Internal Server Error');
    }
};
