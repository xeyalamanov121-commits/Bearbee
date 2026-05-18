const { Telegraf } = require('telegraf');
// Firebase-i idarə etmək üçün lazım olan rəsmi modul
const admin = require('firebase-admin');

// 1. FIREBASE BAĞLANTISI (Əgər tətbiqinizdə artıq başladılıbsa, təkrar başladılmır)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined
        })
    });
}

const db = admin.firestore();
const bot = new Telegraf(process.env.BOT_TOKEN);

// 2. ADMİNƏ DÜYMƏLİ BİLDİRİŞ GÖNDƏRƏN FUNKSİYA
async function sendAdminPanel(txId, transaction) {
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
                    { text: 'Təsdiqlə ✅', callback_data: `approve_${txId}` },
                    { text: 'Ləğv et ❌', callback_data: `reject_${txId}` }
                ]
            ]
        }
    });
}

// 3. İSTİFADƏÇİ BOTA TXID (TEQ) GÖNDƏRDİKDƏ
bot.on('text', async (ctx) => {
    const text = ctx.message.text.trim();
    const userId = ctx.from.id;

    if (text.length < 10) {
        return ctx.reply("⚠️ Lütfən düzgün bir tranzaksiya teqi (TxID) göndərin.");
    }

    try {
        // Firebase Firestore-da eyni TxID-nin olub-olmadığını yoxlayırıq
        const txCheck = await db.collection('transactions').where('txHash', '==', text).get();
        if (!txCheck.empty) {
            return ctx.reply("❌ Bu tranzaksiya teqi artıq sistemdə istifadə olunub!");
        }

        // Yeni tranzaksiya məlumatı
        const newTx = {
            userId: userId,
            txHash: text,
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        // Firebase-ə yazırıq və sənədin unikal ID-sini alırıq
        const docRef = await db.collection('transactions').add(newTx);

        // Adminə (Sizə) təsdiq/ləğv düymələrini göndəririk
        await sendAdminPanel(docRef.id, newTx);
        
        ctx.reply("Tranzaksiya teqiniz qəbul olundu. Admin təsdiqi gözlənilir... ⏳");
    } catch (error) {
        console.error("Firebase xətası:", error);
        ctx.reply("Sistemdə xəta baş verdi, bir az sonra yenidən yoxlayın.");
    }
});

// 4. SİZ (ADMİN) DÜYMƏLƏRDƏN BİRİNƏ BASDIQDA
bot.on('callback_query', async (ctx) => {
    const data = ctx.callbackQuery.data;
    
    if (data.startsWith('approve_') || data.startsWith('reject_')) {
        const [action, id] = data.split('_');
        const status = action === 'approve' ? 'approved' : 'rejected';
        
        try {
            const docRef = db.collection('transactions').doc(id);
            const doc = await docRef.get();

            if (!doc.exists) {
                return ctx.answerCbQuery("⚠️ Tranzaksiya tapılmadı!");
            }

            const tx = doc.data();

            // Firebase-də statusu yeniləyirik
            await docRef.update({ status: status });

            // Düymələri silib mesajı nəticə ilə əvəzləyirik
            const resultText = status === 'approved' ? '✅ TƏSDİQLƏNDİ' : '❌ LƏĞV EDİLDİ';
            await ctx.editMessageText(
                `📋 *Tranzaksiya Nəticəsi:*\n` +
                `👤 *İstifadəçi:* ${tx.userId}\n` +
                `🔗 *TxID:* \`${tx.txHash}\`\n\n` +
                `📢 *Qərar:* ${resultText}`, 
                { parse_mode: 'Markdown' }
            );

            // İstifadəçiyə bildiriş göndəririk
            const userMessage = status === 'approved' 
                ? `🎉 Tranzaksiyanız (${tx.txHash}) admin tərəfindən təsdiqləndi!` 
                : `⚠️ Göndərdiyiniz tranzaksiya teqi (${tx.txHash}) keçərsiz sayıldı və admin tərəfindən ləğv edildi.`;
            
            await bot.telegram.sendMessage(tx.userId, userMessage);
            
        } catch (error) {
            console.error("Düymə işlənmə xətası:", error);
        }
    }
    await ctx.answerCbQuery();
});

// 5. VERCEL SERVERLESS İNTEQRASİYASI
module.exports = async (req, res) => {
    try {
        if (req.method === 'POST') {
            await bot.handleUpdate(req.body, res);
            res.status(200).send('OK');
        } else {
            res.status(200).send('Bot hal-hazırda Firebase ilə aktivdir.');
        }
    } catch (err) {
        console.error("Vercel xətası:", err);
        res.status(500).send('Internal Server Error');
    }
};

