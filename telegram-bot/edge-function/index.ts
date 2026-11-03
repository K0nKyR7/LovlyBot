// Supabase Edge Function for Telegram Webhook (Deno/TypeScript)
// Deploy command: supabase functions deploy telegram-bot --no-verify-jwt

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') || '';
const ALLOWED_USERS = (Deno.env.get('ALLOWED_USER_IDS') || '').split(',').map(s => s.trim());
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('OK', { status: 200 });
  }

  try {
    const update = await req.json();
    const msg = update.message;

    if (!msg || !msg.from) {
      return new Response('OK', { status: 200 });
    }

    const chatId = msg.chat.id;
    const userId = String(msg.from.id);

    if (ALLOWED_USERS.length > 0 && !ALLOWED_USERS.includes(userId)) {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: '🔒 Доступ ограничен.' })
      });
      return new Response('Forbidden', { status: 200 });
    }

    if (msg.photo && msg.photo.length > 0) {
      const highestRes = msg.photo[msg.photo.length - 1];
      const caption = msg.caption || 'Наш прекрасный день';

      const fileRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${highestRes.file_id}`);
      const fileData = await fileRes.json();

      if (fileData.ok && fileData.result.file_path) {
        const imgStream = await fetch(`https://api.telegram.org/file/bot${BOT_TOKEN}/${fileData.result.file_path}`);
        const imgBuffer = await imgStream.arrayBuffer();

        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.jpg`;
        await supabase.storage.from('photos').upload(fileName, imgBuffer, { contentType: 'image/jpeg' });
        const { data: urlData } = supabase.storage.from('photos').getPublicUrl(fileName);

        const moment = {
          id: `moment-${Date.now()}`,
          title: caption.split('\n')[0].slice(0, 80) || 'Наш день',
          date: new Date().toISOString().slice(0, 10),
          category: 'Уютные дни',
          description: caption,
          imageUrl: urlData.publicUrl,
          likes: 1,
          isLiked: true,
          createdAt: new Date().toISOString()
        };

        await supabase.from('moments').insert(moment);

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: `🎉 Фото сохранено и уже доступно на сайте!\n📅 ${moment.date} • ${moment.title}`
          })
        });
      }
    }

    return new Response('OK', { status: 200 });
  } catch (err) {
    console.error('Webhook error:', err);
    return new Response('Error', { status: 500 });
  }
});
