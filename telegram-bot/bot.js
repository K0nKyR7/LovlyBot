/**
 * ============================================================
 * ТЕЛЕГРАМ-БОТ «СЕМЕЙНЫЙ ЛЕТОПИСЕЦ» • НАША ИСТОРИЯ
 * Работает через Long Polling на чистом Node.js (Node 18+)
 * Без тяжелых зависимостей (использует нативный fetch)
 * ============================================================
 */

import fs from 'fs';
import path from 'path';
import http from 'http';

// Загрузка .env файла вручную (без внешнего пакета dotenv)
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        process.env[key] = value.trim();
      }
    }
  }
}
loadEnv();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ALLOWED_USERS = (process.env.ALLOWED_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const START_DATE = new Date('2024-12-21T00:00:00');

const TG_API = BOT_TOKEN ? `https://api.telegram.org/bot${BOT_TOKEN}` : '';

// Хранилище временного состояния для выбора категорий
const pendingUploads = new Map();

// --- ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ TELEGRAM API ---
async function tg(method, payload = {}) {
  const res = await fetch(`${TG_API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

async function sendMessage(chatId, text, replyMarkup = null) {
  const payload = { chat_id: chatId, text, parse_mode: 'HTML' };
  if (replyMarkup) payload.reply_markup = replyMarkup;
  return tg('sendMessage', payload);
}

// Проверка прав доступа (только вы и девушка)
function isAllowed(userId) {
  if (ALLOWED_USERS.length === 0) return true; // если список пуст - разрешено всем для первого запуска
  return ALLOWED_USERS.includes(String(userId));
}

// Загрузка файла в Supabase Storage
async function uploadToSupabaseStorage(fileName, buffer, contentType) {
  const url = `${SUPABASE_URL}/storage/v1/object/photos/${fileName}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'apikey': SUPABASE_KEY,
      'Content-Type': contentType || 'image/jpeg'
    },
    body: buffer
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase Storage Error: ${err}`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/photos/${fileName}`;
}

// Запись момента в таблицу moments Supabase
async function saveMomentToSupabase(moment) {
  const url = `${SUPABASE_URL}/rest/v1/moments`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'apikey': SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(moment)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase DB Error: ${err}`);
  }
  return res.json();
}

// Подсчет дней вместе
function getDaysTogether() {
  const now = new Date();
  const diff = now - START_DATE;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// --- ОБРАБОТКА ВХОДЯЩИХ СООБЩЕНИЙ ---
async function handleMessage(msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text || '';

  if (!isAllowed(userId)) {
    console.log(`Попытка несанкционированного доступа от User ID: ${userId}`);
    return sendMessage(chatId, '🔒 Этот бот является приватным архивом пары. Доступ ограничен.');
  }

  // Команда /start
  if (text.startsWith('/start')) {
    const days = getDaysTogether();
    return sendMessage(
      chatId,
      `💖 <b>Привет, любовь моя!</b>\n\n` +
      `Я ваш персональный семейный бот <b>«Наша История»</b>.\n` +
      `Вы вместе уже <b>${days} дней</b> (с 21.12.2024)!\n\n` +
      `📸 <b>Как мной пользоваться:</b>\n` +
      `Просто отправь мне любое <b>фото</b> с прогулки, ужина или отпуска прямо сюда в чат, а в подписи напиши пару тёплых слов.\n\n` +
      `Я моментально сохраню его и опубликую на вашем сайте!\n\n` +
      `Команды:\n` +
      `• /today — Воспоминание из прошлого в этот день\n` +
      `• /stats — Сколько дней вы вместе и сколько фото в архиве`
    );
  }

  // Команда /stats
  if (text.startsWith('/stats')) {
    const days = getDaysTogether();
    return sendMessage(
      chatId,
      `📊 <b>Наша статистика:</b>\n\n` +
      `⏳ Мы вместе уже: <b>${days} дней</b>\n` +
      `💍 Начало отношений: <b>21 декабря 2024</b>\n` +
      `🌐 Сайт готов к просмотру!`
    );
  }

  // Команда /today (Time Capsule)
  if (text.startsWith('/today') || text.startsWith('/memory')) {
    try {
      let m = null;
      if (SUPABASE_URL && SUPABASE_KEY) {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/moments?select=*&limit=1`, {
          headers: { 'Authorization': `Bearer ${SUPABASE_KEY}`, 'apikey': SUPABASE_KEY }
        });
        const data = await res.json();
        if (data && data.length > 0) m = data[0];
      }

      if (!m) {
        // Fallback to sample memory
        m = {
          title: "Тот самый день, когда всё началось",
          date: "2024-12-21",
          imageUrl: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80",
          description: "Наш первый день, с которого началась эта невероятная история. Помню каждую секунду и твою улыбку 💖"
        };
      }

      await tg('sendPhoto', {
        chat_id: chatId,
        photo: m.imageUrl,
        caption: `✨ <b>Воспоминание из нашего архива:</b>\n\n<b>${m.title}</b> (${m.date})\n${m.description || ''}`,
        parse_mode: 'HTML'
      });
    } catch (e) {
      sendMessage(chatId, 'Не удалось загрузить воспоминание: ' + e.message);
    }
    return;
  }

  // Обработка отправки фотографии
  if (msg.photo && msg.photo.length > 0) {
    const highestRes = msg.photo[msg.photo.length - 1];
    const caption = msg.caption || 'Наш прекрасный день';

    await sendMessage(chatId, '⏳ Загружаю и оптимизирую фото...');

    try {
      const fileInfo = await tg('getFile', { file_id: highestRes.file_id });
      if (!fileInfo.ok || !fileInfo.result.file_path) {
        throw new Error('Не удалось получить файл от Telegram');
      }

      const downloadUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileInfo.result.file_path}`;
      const imgRes = await fetch(downloadUrl);
      const arrayBuffer = await imgRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.jpg`;
      let publicUrl = '';

      if (SUPABASE_URL && SUPABASE_KEY) {
        publicUrl = await uploadToSupabaseStorage(fileName, buffer, 'image/jpeg');
      } else {
        // Save locally to assets/photos
        const localDir = path.resolve(process.cwd(), '../assets/photos');
        if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });
        const localFilePath = path.join(localDir, fileName);
        fs.writeFileSync(localFilePath, buffer);
        publicUrl = `assets/photos/${fileName}`;
      }

      const momentId = `moment-${Date.now()}`;
      const today = new Date().toISOString().slice(0, 10);

      const moment = {
        id: momentId,
        title: caption.split('\n')[0].slice(0, 80) || 'Наш день',
        date: today,
        category: 'Уютные дни',
        description: caption,
        imageUrl: publicUrl,
        likes: 1,
        isLiked: true,
        createdAt: new Date().toISOString()
      };

      if (SUPABASE_URL && SUPABASE_KEY) {
        await saveMomentToSupabase(moment);
      } else {
        // Save to local moments.json
        const jsonPath = path.resolve(process.cwd(), '../assets/moments.json');
        let localList = [];
        if (fs.existsSync(jsonPath)) {
          try { localList = JSON.parse(fs.readFileSync(jsonPath, 'utf8')); } catch (e) {}
        }
        localList.unshift(moment);
        fs.writeFileSync(jsonPath, JSON.stringify(localList, null, 2));
      }

      pendingUploads.set(momentId, moment);

      const keyboard = {
        inline_keyboard: [
          [
            { text: '🥂 Свидания', callback_data: `cat:${momentId}:Свидания` },
            { text: '✈️ Путешествия', callback_data: `cat:${momentId}:Путешествия` }
          ],
          [
            { text: '☕ Уютные дни', callback_data: `cat:${momentId}:Уютные дни` },
            { text: '😄 Смешное', callback_data: `cat:${momentId}:Смешные моменты` }
          ],
          [
            { text: '🎉 Памятные даты', callback_data: `cat:${momentId}:Памятные даты` }
          ]
        ]
      };

      await sendMessage(
        chatId,
        `🎉 <b>Фото успешно сохранено!</b>\n\n` +
        `📝 Заголовок: <i>${moment.title}</i>\n` +
        `📅 Дата: <i>${moment.date}</i>\n\n` +
        `Выбери категорию для этого момента:`,
        keyboard
      );

    } catch (err) {
      console.error('Ошибка сохранения:', err);
      sendMessage(chatId, `❌ Ошибка при сохранении: ${err.message}`);
    }
  }
}

// Обработка нажатий на инлайн-кнопки
async function handleCallbackQuery(query) {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const data = query.data || '';

  if (data.startsWith('cat:')) {
    const [, momentId, category] = data.split(':');
    try {
      // Обновляем категорию в базе Supabase
      await fetch(`${SUPABASE_URL}/rest/v1/moments?id=eq.${momentId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'apikey': SUPABASE_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ category })
      });

      await tg('answerCallbackQuery', {
        callback_query_id: query.id,
        text: `Категория изменена на «${category}»!`
      });

      await tg('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text: `✅ <b>Момент сохранён в раздел «${category}»!</b>\nОн уже виден на сайте 💖`,
        parse_mode: 'HTML'
      });
    } catch (e) {
      console.warn('Ошибка смены категории:', e);
    }
  }
}

// --- LONG POLLING ДВИЖОК ---
let lastUpdateId = 0;

async function pollUpdates() {
  try {
    const res = await tg('getUpdates', {
      offset: lastUpdateId + 1,
      timeout: 25
    });

    if (res.ok && res.result && res.result.length > 0) {
      for (const update of res.result) {
        lastUpdateId = update.update_id;
        if (update.message) {
          await handleMessage(update.message);
        } else if (update.callback_query) {
          await handleCallbackQuery(update.callback_query);
        }
      }
    }
  } catch (err) {
    console.error('Ошибка Polling:', err.message);
    await new Promise(r => setTimeout(r, 3000));
  }

  setImmediate(pollUpdates);
}

// HTTP сервер для бесплатного хостинга на Render.com (health-check)
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('💖 Наша История • Telegram-бот активен и работает 24/7 на Render!');
});

server.listen(PORT, () => {
  console.log(`🌐 HTTP сервер запущен на порту ${PORT} (Render.com health-check готов)`);
});

// Запуск бота
console.log('----------------------------------------------------');
console.log('🤖 Telegram-бот «Семейный летописец» запускается...');
console.log(`💖 Отсчет отношений: 21.12.2024 (прошло ${getDaysTogether()} дней)`);
if (ALLOWED_USERS.length > 0) {
  console.log(`🔒 Белый список пользователей: ${ALLOWED_USERS.join(', ')}`);
} else {
  console.log('⚠️ Внимание: ALLOWED_USER_IDS не задан — бот принимает сообщения от любого пользователя.');
}
console.log('----------------------------------------------------');

if (BOT_TOKEN) {
  pollUpdates();
} else {
  console.warn('⚠️ Внимание: TELEGRAM_BOT_TOKEN не задан. Бот ожидает настройки Environment Variables.');
}
