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

// Хранилища состояния
const pendingUploads = new Map();
const lastUserMoments = new Map();  // userId -> { momentId, title, timestamp }
const userState = new Map();        // userId -> { state: 'AWAITING_LOCATION', momentId }
const mediaGroupQueue = new Map();  // mediaGroupId -> { timer, items: [], chatId, userId, caption }

// 40 романтических причин любви для команды /reasons или /love
const REASONS_OF_LOVE = [
  "За твою невероятную улыбку, от которой теплеет даже в самый хмурый и холодный день.",
  "За то, как ты уютно обнимаешь меня во сне и прижимаешься ближе.",
  "За то, что с тобой я могу быть настоящим собой — без масок и сомнений.",
  "За твои глаза, в которых отражается целый мир, в котором мне так спокойно.",
  "За наши долгие ночные разговоры обо всём на свете под горячий чай.",
  "За твой заразительный смех — самый красивый звук во всей Вселенной.",
  "За то, как ты искренне радуешься мелочам и делаешь обычный день праздником.",
  "За то, что любое путешествие с тобой — это лучшее приключение жизни.",
  "За твоё бесконечно доброе сердце и умение поддержать в нужную секунду.",
  "За наши совместные глупости и шутки, понятные только нам двоим.",
  "За тепло твоих рук, когда мы гуляем по зимнему городу.",
  "За то, как вкусно пахнут твои волосы, когда я целую тебя утром.",
  "За то, что ты веришь в меня больше, чем кто-либо другой в этом мире.",
  "За то, как мы вместе выбираем фильмы и засыпаем на первых 20 минутах.",
  "За каждую чашку кофе, выпитую вместе в тишине и уюте.",
  "За твои милые привычки, о которых знаю только я.",
  "За то, что дом — это не место, а состояние, когда ты рядом.",
  "За то, как ты смотришь на меня, когда думаешь, что я не замечаю.",
  "За то, что каждый день с 21 декабря 2024 года наполнен настоящим смыслом.",
  "За то, что ты делаешь меня лучшей версией себя с каждым днём.",
  "За наши спонтанные прогулки и вкусную еду по ночам.",
  "За то, как бьётся твоё сердце, когда я крепко обнимаю тебя.",
  "За твоё невероятное терпение и умение понять меня с полуслова.",
  "За то, что в твоих объятиях исчезают любые проблемы и тревоги.",
  "За то, что наша история — самая красивая сказка, которую мы пишем вместе."
];

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

// Проверка прав доступа
function isAllowed(userId) {
  if (ALLOWED_USERS.length === 0) return true;
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

// Обновление геопозиции момента в Supabase
async function updateMomentLocation(momentId, lat, lng, location) {
  if (SUPABASE_URL && SUPABASE_KEY) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/moments?id=eq.${momentId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ lat, lng, location })
    });
    return res.ok;
  }
  return false;
}

// Подсчет дней вместе
function getDaysTogether() {
  const now = new Date();
  const diff = now - START_DATE;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// --- УМНЫЙ GEOCODING & EXIF ДВИЖОК ---

// Обратное геокодирование (координаты -> город / улица)
async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1&accept-language=ru`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'LoveStoryBot/1.0 (love-story@pair.local)' }
    });
    if (!res.ok) return `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`;
    const data = await res.json();
    if (data && data.address) {
      const a = data.address;
      const city = a.city || a.town || a.village || a.suburb || a.municipality || a.state;
      const place = a.road || a.tourism || a.amenity || '';
      if (city && place) return `${city}, ${place}`;
      if (city) return city;
      return data.display_name.split(',').slice(0, 2).join(', ').trim();
    }
  } catch (e) {
    console.warn('Reverse geocode error:', e.message);
  }
  return `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`;
}

// Прямое геокодирование (текст -> координаты)
async function forwardGeocode(query) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&accept-language=ru`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'LoveStoryBot/1.0 (love-story@pair.local)' }
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.length > 0) {
      const item = data[0];
      const parts = item.display_name.split(',').map(s => s.trim());
      const displayName = parts.length > 2 ? `${parts[0]}, ${parts[1]}` : parts[0];
      return {
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        displayName
      };
    }
  } catch (e) {
    console.warn('Forward geocode error:', e.message);
  }
  return null;
}

// Авто-распознавание города/места из текста подписи (например: "в Сочи", "в Москве", "на Красной площади")
async function extractLocationFromCaption(caption) {
  if (!caption) return null;
  const match = caption.match(/(?:в|на|около|возле)\s+([А-ЯЁ][а-яё\-]+(?:\s+[А-ЯЁ][а-яё\-]+)?)/i);
  if (match) {
    const place = match[1].trim();
    const blacklist = ['Этот', 'Наш', 'Твой', 'Мой', 'Первый', 'Самый', 'Прекрасный'];
    if (!blacklist.includes(place) && place.length >= 3) {
      const geo = await forwardGeocode(place);
      if (geo) return geo;
    }
  }
  return null;
}

// Парсер EXIF из буфера фото
function extractExifMetadata(buffer) {
  try {
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    if (view.getUint16(0) !== 0xFFD8) return { hasExif: false };

    let offset = 2;
    const length = view.byteLength;
    while (offset < length) {
      if (view.getUint8(offset) !== 0xFF) break;
      const marker = view.getUint8(offset + 1);
      if (marker === 0xE1) {
        const exifHeader = view.getUint32(offset + 4);
        if (exifHeader === 0x45786966) { // 'Exif'
          const tiffOffset = offset + 10;
          return parseTiffExif(view, tiffOffset);
        }
      }
      const markerLength = view.getUint16(offset + 2);
      offset += 2 + markerLength;
    }
  } catch (err) {
    console.warn('EXIF parse error:', err.message);
  }
  return { hasExif: false };
}

function parseTiffExif(view, tiffOffset) {
  try {
    const endianness = view.getUint16(tiffOffset);
    const isLittleEndian = endianness === 0x4949; // 'II'
    if (view.getUint16(tiffOffset + 2, isLittleEndian) !== 0x002A) return { hasExif: false };

    const firstIFDOffset = view.getUint32(tiffOffset + 4, isLittleEndian);
    const ifd0 = tiffOffset + firstIFDOffset;
    let subExifOffset = null, gpsIFDOffset = null;
    const numEntries = view.getUint16(ifd0, isLittleEndian);

    for (let i = 0; i < numEntries; i++) {
      const entryOffset = ifd0 + 2 + i * 12;
      const tag = view.getUint16(entryOffset, isLittleEndian);
      const val = view.getUint32(entryOffset + 8, isLittleEndian);
      if (tag === 0x8769) subExifOffset = tiffOffset + val;
      else if (tag === 0x8825) gpsIFDOffset = tiffOffset + val;
    }

    let dateTimeOriginal = null;
    if (subExifOffset) {
      dateTimeOriginal = readStringTag(view, subExifOffset, 0x9003, isLittleEndian, tiffOffset);
    }

    let gpsData = null;
    if (gpsIFDOffset) {
      gpsData = readGpsData(view, gpsIFDOffset, isLittleEndian, tiffOffset);
    }

    let parsedDate = null;
    if (dateTimeOriginal) {
      const parts = dateTimeOriginal.split(' ')[0].split(':');
      if (parts.length === 3) parsedDate = `${parts[0]}-${parts[1]}-${parts[2]}`;
    }

    return { hasExif: true, originalDate: parsedDate, gps: gpsData };
  } catch (e) {
    return { hasExif: false };
  }
}

function readStringTag(view, ifdOffset, targetTag, isLittleEndian, tiffOffset) {
  try {
    const numEntries = view.getUint16(ifdOffset, isLittleEndian);
    for (let i = 0; i < numEntries; i++) {
      const entry = ifdOffset + 2 + i * 12;
      const tag = view.getUint16(entry, isLittleEndian);
      if (tag === targetTag) {
        const count = view.getUint32(entry + 4, isLittleEndian);
        const offset = view.getUint32(entry + 8, isLittleEndian);
        const strOffset = tiffOffset + offset;
        let str = '';
        for (let j = 0; j < count - 1; j++) str += String.fromCharCode(view.getUint8(strOffset + j));
        return str.trim();
      }
    }
  } catch (e) {}
  return null;
}

function readGpsData(view, gpsOffset, isLittleEndian, tiffOffset) {
  try {
    const numEntries = view.getUint16(gpsOffset, isLittleEndian);
    let lat = null, latRef = 'N', lon = null, lonRef = 'E';
    for (let i = 0; i < numEntries; i++) {
      const entry = gpsOffset + 2 + i * 12;
      const tag = view.getUint16(entry, isLittleEndian);
      if (tag === 0x0001) latRef = String.fromCharCode(view.getUint8(entry + 8));
      else if (tag === 0x0002) lat = readRationalCoordinates(view, entry, isLittleEndian, tiffOffset);
      else if (tag === 0x0003) lonRef = String.fromCharCode(view.getUint8(entry + 8));
      else if (tag === 0x0004) lon = readRationalCoordinates(view, entry, isLittleEndian, tiffOffset);
    }
    if (lat !== null && lon !== null) {
      let finalLat = lat[0] + lat[1] / 60 + lat[2] / 3600;
      let finalLon = lon[0] + lon[1] / 60 + lon[2] / 3600;
      if (latRef === 'S') finalLat = -finalLat;
      if (lonRef === 'W') finalLon = -finalLon;
      return { lat: Number(finalLat.toFixed(6)), lng: Number(finalLon.toFixed(6)) };
    }
  } catch (e) {}
  return null;
}

function readRationalCoordinates(view, entryOffset, isLittleEndian, tiffOffset) {
  const offset = view.getUint32(entryOffset + 8, isLittleEndian);
  const dataOffset = tiffOffset + offset;
  const values = [];
  for (let i = 0; i < 3; i++) {
    const num = view.getUint32(dataOffset + i * 8, isLittleEndian);
    const den = view.getUint32(dataOffset + i * 8 + 4, isLittleEndian);
    values.push(den === 0 ? 0 : num / den);
  }
  return values;
}

// Создание инлайн-клавиатуры для момента
function makeMomentKeyboard(momentId) {
  return {
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
      ],
      [
        { text: '📍 Указать место / город', callback_data: `loc:${momentId}` }
      ]
    ]
  };
}

// --- ОБРАБОТКА ВХОДЯЩИХ СООБЩЕНИЙ ---
async function handleMessage(msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = (msg.text || '').trim();

  if (!isAllowed(userId)) {
    console.log(`Попытка несанкционированного доступа от User ID: ${userId}`);
    return sendMessage(chatId, '🔒 Этот бот является приватным архивом пары. Доступ ограничен.');
  }

  // 1. Команда /start
  if (text.startsWith('/start')) {
    const days = getDaysTogether();
    return sendMessage(
      chatId,
      `💖 <b>Привет, любовь моя!</b>\n\n` +
      `Я ваш персональный семейный бот <b>«Наша История»</b>.\n` +
      `Вы вместе уже <b>${days} дней</b> (с 21.12.2024)!\n\n` +
      `📸 <b>Что я умею:</b>\n` +
      `• Отправь любое <b>фото</b> с прогулки, ужина или поездки — я сохраню его на сайт.\n` +
      `• Отправь <b>альбом из нескольких фото</b> — я объединю их аккуратно.\n` +
      `• Отправь фото <b>как файл/документ</b> — я сам считаю GPS и дату из метаданных!\n` +
      `• Отправь <b>геопозицию (📎 ➔ Геопозиция)</b> — поставлю пульсирующее сердечко на карте.\n` +
      `• Отправь <b>голосовое сообщение 🎤</b> — я сохраню аудио-послание в архив!\n\n` +
      `✨ <b>Команды:</b>\n` +
      `• /reasons — 100 причин, почему я тебя люблю 💖\n` +
      `• /today — Воспоминание из нашего архива\n` +
      `• /stats — Сколько дней вместе и статистика`
    );
  }

  // 2. Команда /stats
  if (text.startsWith('/stats')) {
    const days = getDaysTogether();
    return sendMessage(
      chatId,
      `📊 <b>Наша статистика:</b>\n\n` +
      `⏳ Мы вместе уже: <b>${days} дней</b>\n` +
      `💍 Начало отношений: <b>21 декабря 2024</b>\n` +
      `🌐 Сайт открыт и синхронизирован 24/7!`
    );
  }

  // 3. Команда /reasons или /love или /compliment (Причины любви)
  if (text.startsWith('/reasons') || text.startsWith('/love') || text.startsWith('/compliment')) {
    const randomReason = REASONS_OF_LOVE[Math.floor(Math.random() * REASONS_OF_LOVE.length)];
    return sendMessage(
      chatId,
      `💖 <b>Причина, почему я люблю тебя:</b>\n\n` +
      `<i>«${randomReason}»</i>\n\n` +
      `✨ <i>Каждый день с тобой — это счастье.</i>`
    );
  }

  // 4. Команда /today (Time Capsule из реальной базы)
  if (text.startsWith('/today') || text.startsWith('/memory')) {
    try {
      let m = null;
      if (SUPABASE_URL && SUPABASE_KEY) {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/moments?select=*&order=createdAt.desc&limit=25`, {
          headers: { 'Authorization': `Bearer ${SUPABASE_KEY}`, 'apikey': SUPABASE_KEY }
        });
        const moments = await res.json();
        if (moments && moments.length > 0) {
          m = moments[Math.floor(Math.random() * moments.length)];
        }
      }

      if (!m) {
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
        caption: `✨ <b>Воспоминание из нашего архива:</b>\n\n<b>${m.title}</b> (${m.date})\n${m.location ? '📍 ' + m.location + '\n' : ''}${m.description || ''}`,
        parse_mode: 'HTML'
      });
    } catch (e) {
      sendMessage(chatId, 'Не удалось загрузить воспоминание: ' + e.message);
    }
    return;
  }

  // 5. Обработка голосовых сообщений (msg.voice)
  if (msg.voice) {
    await sendMessage(chatId, '🎙️ Сохраняю твоё голосовое послание в архив любви...');
    try {
      const fileInfo = await tg('getFile', { file_id: msg.voice.file_id });
      if (!fileInfo.ok || !fileInfo.result.file_path) {
        throw new Error('Не удалось получить голосовой файл');
      }

      const downloadUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileInfo.result.file_path}`;
      const voiceRes = await fetch(downloadUrl);
      const buffer = Buffer.from(await voiceRes.arrayBuffer());

      const fileName = `voice-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.ogg`;
      let publicUrl = '';
      if (SUPABASE_URL && SUPABASE_KEY) {
        publicUrl = await uploadToSupabaseStorage(fileName, buffer, 'audio/ogg');
      }

      const momentId = `voice-${Date.now()}`;
      const senderName = msg.from.first_name || 'Любовь моя';
      const moment = {
        id: momentId,
        title: `🎤 Голосовое признание (${senderName})`,
        date: new Date().toISOString().slice(0, 10),
        category: 'Уютные дни',
        description: `Голосовое аудио-послание от ${senderName} 💌`,
        imageUrl: publicUrl || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1200&q=80',
        likes: 1,
        isLiked: true,
        createdAt: new Date().toISOString()
      };

      if (SUPABASE_URL && SUPABASE_KEY) {
        await saveMomentToSupabase(moment);
      }

      lastUserMoments.set(userId, { momentId, title: moment.title, timestamp: Date.now() });

      return sendMessage(
        chatId,
        `💌 <b>Голосовое послание сохранено навсегда!</b>\n\n` +
        `Теперь его можно послушать прямо на сайте в вашей общей ленте 💖`
      );
    } catch (err) {
      console.error('Ошибка сохранения голоса:', err);
      return sendMessage(chatId, `❌ Не удалось сохранить аудио: ${err.message}`);
    }
  }

  // 6. Пользователь отправил геопозицию (📎 ➔ Геопозиция)
  if (msg.location) {
    const { latitude, longitude } = msg.location;
    const waiting = userState.get(userId);
    const recent = lastUserMoments.get(userId);
    const targetMomentId = waiting?.momentId || recent?.momentId;

    if (!targetMomentId) {
      return sendMessage(
        chatId,
        '💡 <b>Геопозиция получена!</b>\nСначала отправь фотографию, а затем присылай локацию к ней, чтобы я привязал метку на карте.'
      );
    }

    await sendMessage(chatId, '🔍 Определяю адрес и ставлю отметку на карте...');
    const placeName = await reverseGeocode(latitude, longitude);
    await updateMomentLocation(targetMomentId, latitude, longitude, placeName);
    userState.delete(userId);

    return sendMessage(
      chatId,
      `📍 <b>Геопозиция успешно прикреплена!</b>\n\n` +
      `Место: <b>${placeName}</b>\n` +
      `Координаты: <code>${latitude.toFixed(4)}, ${longitude.toFixed(4)}</code>\n\n` +
      `На карте сайта появилось пульсирующее сердечко 💖`
    );
  }

  // 7. Ответ текстом на запрос города / места (AWAITING_LOCATION)
  if (text && userState.get(userId)?.state === 'AWAITING_LOCATION') {
    const { momentId } = userState.get(userId);
    userState.delete(userId);

    await sendMessage(chatId, `🔍 Ищу на карте «${text}»...`);
    const geo = await forwardGeocode(text);

    if (geo) {
      await updateMomentLocation(momentId, geo.lat, geo.lng, geo.displayName);
      return sendMessage(
        chatId,
        `📍 <b>Локация найдена и прикреплена!</b>\n\n` +
        `Отметка: <b>${geo.displayName}</b>\n` +
        `Координаты: <code>${geo.lat.toFixed(4)}, ${geo.lng.toFixed(4)}</code>\n\n` +
        `Сердечко на карте обновлено! 💖`
      );
    } else {
      await updateMomentLocation(momentId, null, null, text);
      return sendMessage(
        chatId,
        `📝 Записал название места как <i>«${text}»</i>.\n(Если захочешь поставить точную точку на карте — просто отправь геопозицию через скрепку 📎).`
      );
    }
  }

  // 8. Обработка фотографий (msg.photo или msg.document)
  const isDocImage = msg.document && (
    (msg.document.mime_type && msg.document.mime_type.startsWith('image/')) ||
    /\.(jpe?g|png|heic|webp)$/i.test(msg.document.file_name || '')
  );

  if ((msg.photo && msg.photo.length > 0) || isDocImage) {
    // Поддержка альбомов (media_group_id)
    if (msg.media_group_id) {
      const mgId = msg.media_group_id;
      if (!mediaGroupQueue.has(mgId)) {
        mediaGroupQueue.set(mgId, {
          timer: null,
          items: [],
          chatId,
          userId,
          caption: msg.caption || ''
        });
      }

      const queueObj = mediaGroupQueue.get(mgId);
      queueObj.items.push(msg);
      if (msg.caption) queueObj.caption = msg.caption;

      if (queueObj.timer) clearTimeout(queueObj.timer);
      queueObj.timer = setTimeout(async () => {
        const fullQueue = mediaGroupQueue.get(mgId);
        mediaGroupQueue.delete(mgId);
        if (fullQueue) await processMediaGroup(fullQueue);
      }, 1500);

      return;
    }

    // Одиночное фото
    await processSinglePhoto(msg, isDocImage);
  }
}

// Обработка одного фото
async function processSinglePhoto(msg, isDocImage) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const caption = msg.caption || 'Наш прекрасный день';

  await sendMessage(chatId, isDocImage ? '⏳ Загружаю оригинальный файл и считываю EXIF...' : '⏳ Загружаю и оптимизирую фото...');

  try {
    const fileId = isDocImage ? msg.document.file_id : msg.photo[msg.photo.length - 1].file_id;
    const fileInfo = await tg('getFile', { file_id: fileId });
    if (!fileInfo.ok || !fileInfo.result.file_path) {
      throw new Error('Не удалось получить файл от Telegram');
    }

    const downloadUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileInfo.result.file_path}`;
    const imgRes = await fetch(downloadUrl);
    const buffer = Buffer.from(await imgRes.arrayBuffer());

    // 1. Считываем EXIF (дата съемки и GPS)
    const exif = extractExifMetadata(buffer);
    let detectedDate = exif.originalDate || new Date().toISOString().slice(0, 10);
    let detectedLat = exif.gps ? exif.gps.lat : null;
    let detectedLng = exif.gps ? exif.gps.lng : null;
    let detectedLocation = null;

    if (detectedLat && detectedLng) {
      detectedLocation = await reverseGeocode(detectedLat, detectedLng);
    }

    // 2. Если GPS в EXIF нет, пробуем умный поиск города прямо из текста подписи!
    if (!detectedLocation && caption) {
      const fromCaption = await extractLocationFromCaption(caption);
      if (fromCaption) {
        detectedLat = fromCaption.lat;
        detectedLng = fromCaption.lng;
        detectedLocation = fromCaption.displayName;
      }
    }

    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.jpg`;
    let publicUrl = '';

    if (SUPABASE_URL && SUPABASE_KEY) {
      publicUrl = await uploadToSupabaseStorage(fileName, buffer, isDocImage ? (msg.document.mime_type || 'image/jpeg') : 'image/jpeg');
    } else {
      const localDir = path.resolve(process.cwd(), '../assets/photos');
      if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });
      const localFilePath = path.join(localDir, fileName);
      fs.writeFileSync(localFilePath, buffer);
      publicUrl = `assets/photos/${fileName}`;
    }

    const momentId = `moment-${Date.now()}`;
    const moment = {
      id: momentId,
      title: caption.split('\n')[0].slice(0, 80) || 'Наш день',
      date: detectedDate,
      category: detectedLocation ? 'Путешествия' : 'Уютные дни',
      location: detectedLocation || null,
      lat: detectedLat,
      lng: detectedLng,
      description: caption,
      imageUrl: publicUrl,
      likes: 1,
      isLiked: true,
      createdAt: new Date().toISOString()
    };

    if (SUPABASE_URL && SUPABASE_KEY) {
      await saveMomentToSupabase(moment);
    }

    pendingUploads.set(momentId, moment);
    lastUserMoments.set(userId, { momentId, title: moment.title, timestamp: Date.now() });

    let locationInfoText = '';
    if (detectedLocation) {
      locationInfoText = `\n📍 <b>Авто-локация:</b> <i>${detectedLocation}</i>\n🗺️ Метка уже на карте!`;
    } else {
      locationInfoText = `\n💡 <i>Хочешь поставить метку на карте? Нажми кнопку ниже или отправь геопозицию через 📎</i>`;
    }

    await sendMessage(
      chatId,
      `🎉 <b>Фото успешно сохранено!</b>\n\n` +
      `📝 Заголовок: <i>${moment.title}</i>\n` +
      `📅 Дата: <i>${moment.date}</i>` +
      locationInfoText + `\n\n` +
      `Выбери категорию для этого момента:`,
      makeMomentKeyboard(momentId)
    );

  } catch (err) {
    console.error('Ошибка сохранения:', err);
    sendMessage(chatId, `❌ Ошибка при сохранении: ${err.message}`);
  }
}

// Обработка группы фото (альбома)
async function processMediaGroup(queueObj) {
  const { chatId, userId, items, caption } = queueObj;
  await sendMessage(chatId, `⏳ Загружаю альбом из ${items.length} фото...`);

  const createdMoments = [];
  let detectedLocation = null;
  let detectedLat = null;
  let detectedLng = null;

  if (caption) {
    const fromCap = await extractLocationFromCaption(caption);
    if (fromCap) {
      detectedLat = fromCap.lat;
      detectedLng = fromCap.lng;
      detectedLocation = fromCap.displayName;
    }
  }

  for (let i = 0; i < items.length; i++) {
    const m = items[i];
    try {
      const isDoc = m.document;
      const fileId = isDoc ? m.document.file_id : m.photo[m.photo.length - 1].file_id;
      const fileInfo = await tg('getFile', { file_id: fileId });
      if (!fileInfo.ok || !fileInfo.result.file_path) continue;

      const downloadUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileInfo.result.file_path}`;
      const imgRes = await fetch(downloadUrl);
      const buffer = Buffer.from(await imgRes.arrayBuffer());

      const fileName = `${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}.jpg`;
      const publicUrl = await uploadToSupabaseStorage(fileName, buffer, 'image/jpeg');

      // EXIF check if first item
      if (!detectedLocation) {
        const exif = extractExifMetadata(buffer);
        if (exif.gps) {
          detectedLat = exif.gps.lat;
          detectedLng = exif.gps.lng;
          detectedLocation = await reverseGeocode(detectedLat, detectedLng);
        }
      }

      const momentId = `moment-${Date.now()}-${i}`;
      const moment = {
        id: momentId,
        title: caption ? (i === 0 ? caption.slice(0, 80) : `${caption.slice(0, 60)} (${i + 1})`) : `Наш день • Фото ${i + 1}`,
        date: new Date().toISOString().slice(0, 10),
        category: detectedLocation ? 'Путешествия' : 'Уютные дни',
        location: detectedLocation || null,
        lat: detectedLat,
        lng: detectedLng,
        description: caption || 'Совместные воспоминания',
        imageUrl: publicUrl,
        likes: 1,
        isLiked: true,
        createdAt: new Date().toISOString()
      };

      await saveMomentToSupabase(moment);
      createdMoments.push(moment);
    } catch (e) {
      console.warn('Ошибка загрузки элемента альбома:', e.message);
    }
  }

  if (createdMoments.length > 0) {
    const leadMoment = createdMoments[0];
    lastUserMoments.set(userId, { momentId: leadMoment.id, title: leadMoment.title, timestamp: Date.now() });

    await sendMessage(
      chatId,
      `🎉 <b>Альбом из ${createdMoments.length} фото успешно сохранён!</b>\n\n` +
      `📝 Название: <i>${leadMoment.title}</i>\n` +
      (detectedLocation ? `📍 Локация: <b>${detectedLocation}</b>\n` : '') +
      `Все фотографии уже на сайте 💖\n\n` +
      `Выбери общую категорию для альбома:`,
      makeMomentKeyboard(leadMoment.id)
    );
  }
}

// Обработка нажатий на инлайн-кнопки
async function handleCallbackQuery(query) {
  const chatId = query.message.chat.id;
  const userId = query.from.id;
  const messageId = query.message.message_id;
  const data = query.data || '';

  // Смена категории
  if (data.startsWith('cat:')) {
    const [, momentId, category] = data.split(':');
    try {
      if (SUPABASE_URL && SUPABASE_KEY) {
        await fetch(`${SUPABASE_URL}/rest/v1/moments?id=eq.${momentId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'apikey': SUPABASE_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ category })
        });
      }

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
    return;
  }

  // Запрос на указание локации
  if (data.startsWith('loc:')) {
    const [, momentId] = data.split(':');
    userState.set(userId, { state: 'AWAITING_LOCATION', momentId });

    await tg('answerCallbackQuery', {
      callback_query_id: query.id,
      text: 'Жду название города или геопозицию!'
    });

    await sendMessage(
      chatId,
      `📍 <b>Где было сделано это фото?</b>\n\n` +
      `1. Напиши город или место прямо сюда в чат (например: <i>Сочи</i> или <i>Москва, Красная площадь</i>)\n` +
      `2. Или отправь геопозицию через скрепку: 📎 ➔ «Геопозиция».\n\n` +
      `Я сам определю координаты и поставлю пульсирующее сердечко на карте! 💖`
    );
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
