import { Telegraf } from 'telegraf';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import express from 'express';

// --- RENDER PORT BINDING ---
const expressApp = express();
const PORT = process.env.PORT || 10000;
expressApp.get('/', (req, res) => res.send('Bot is active!'));
expressApp.listen(PORT, () => console.log(`Port open: ${PORT}`));

// --- DATABASE CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyBqxSvtSrKLjb-0Yq91abjXhqPy8JIbSJs",
  authDomain: "veliogrenci-cce71.firebaseapp.com",
  projectId: "veliogrenci-cce71",
  storageBucket: "veliogrenci-cce71.firebasestorage.app",
  messagingSenderId: "1092640766125",
  appId: "1:1092640766125:web:c3b7c7dc99606515946e24"
};

// Credentials
const TELEGRAM_BOT_TOKEN = '8903876036:AAEDESUha3MUDfkJKUSJQ5OQDqlNqREn39s';
const OPENROUTER_API_KEY = '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'.trim();

// Init
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

// --- CONTEXT GENERATOR ---
async function getSystemContext() {
  try {
    const studentSnap = await getDocs(collection(db, "students"));
    const students = [];
    studentSnap.forEach(doc => students.push(doc.data()));

    const assignQuery = query(collection(db, "assignments"), orderBy("submittedAt", "desc"), limit(5));
    const assignSnap = await getDocs(assignQuery);
    const recentAssignments = [];
    assignSnap.forEach(doc => {
      const data = doc.data();
      if (data.status === 'Tamamlandı') {
        recentAssignments.push(data);
      }
    });

    let context = "Sistemdeki Guncel Ogrenci Durumlari:\n";
    students.forEach(s => {
      context += `- Ogrenci Adi: ${s.name}, Kullanici Adi: ${s.username}, Son Giris: ${s.lastLogin || 'Yok'}, Not: ${s.teacherNotes || 'Yok'}\n`;
    });

    context += "\nSon Tamamlanan Odevler:\n";
    if (recentAssignments.length === 0) {
      context += "- Yok.\n";
    } else {
      recentAssignments.forEach(a => {
        const studentName = students.find(s => s.id === a.studentId)?.name || "Bilinmeyen Ogrenci";
        context += `- Ogrenci: ${studentName}, Odev: ${a.title}, Tarih: ${a.submittedAt || 'Yok'}\n`;
      });
    }

    return context;
  } catch (error) {
    return "Sistem verilerine su an ulasilamiyor.";
  }
}

// --- OPENROUTER FETCH ---
async function askOpenRouter(systemPrompt, userMessage) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`
    },
    body: JSON.stringify({
      model: 'openrouter/auto',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  if (data.choices && data.choices[0] && data.choices[0].message) {
    return data.choices[0].message.content;
  } else {
    throw new Error("No response content");
  }
}

// --- BOT LOGIC ---
bot.on('text', async (ctx) => {
  const userMessage = ctx.message.text;
  
  try {
    const liveSystemData = await getSystemContext();
    const systemPrompt = `
      Sen Sinifim360 platformunun akilli egitim asistanisin. Kullanici sorular soracak.
      Anlik canli verilere gore net, samimi ve dogru cevaplar ver. 
      Turkce karakterleri cevaplarinda normal sekilde kullanabilirsin.

      Canli Sistem Verileri:
      ${liveSystemData}
    `;

    const responseText = await askOpenRouter(systemPrompt, userMessage);
    await ctx.reply(responseText);
  } catch (error) {
    await ctx.reply(`🤖 Teknik Hata Detayi:\n${error.message}`);
  }
});

// Start Bot
bot.launch().then(() => {
  console.log("Bot running...");
});
