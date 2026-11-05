// ============================================================
// НАША ИСТОРИЯ ЛЮБВИ • SELF-CONTAINED APPLICATION SCRIPT
// Работает как по протоколу file:///, так и на любом веб-сервере
// ============================================================

(function () {
  'use strict';

  // --- 1. INITIAL MOCK DATA & CONFIG ---
  const INITIAL_CONFIG = {
    startDate: "2024-12-21T00:00:00",
    coupleNames: "Мы вместе",
    partnerName: "Моя любимая",
    defaultPin: "2112", // 21 декабря (21.12)
    quote: "В тебе есть весь мой мир, всё мое счастье и всё моё спокойствие.",
    defaultSupabaseUrl: "https://bjujgmewkjwuxjnrnedi.supabase.co",
    defaultSupabaseKey: "sb_publishable_NNfGb2ZF6DfyXmo2H8iOSQ_Qw9CXW0-"
  };

  const INITIAL_MOMENTS = [
    {
      id: "moment-1",
      title: "День, когда всё началось",
      date: "2024-12-21",
      category: "Памятные даты",
      location: "Тот самый зимний вечер • Москва",
      lat: 55.7539,
      lng: 37.6208,
      description: "Наш первый день, с которого началась эта невероятная история. Помню каждую секунду, твою улыбку и то ощущение, что теперь всё будет совершенно иначе.",
      imageUrl: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80",
      likes: 12,
      isLiked: true,
      createdAt: "2024-12-21T18:00:00Z"
    },
    {
      id: "moment-2",
      title: "Кофе, снег и твои тёплые варежки",
      date: "2025-01-08",
      category: "Свидания",
      location: "Уютная кофейня в центре • Москва",
      lat: 55.7601,
      lng: 37.6186,
      description: "На улице был мороз, а мы грелись пряным капучино и говорили обо всём на свете. Твой смех заставляет забыть о любых проблемах.",
      imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80",
      likes: 7,
      isLiked: false,
      createdAt: "2025-01-08T15:30:00Z"
    },
    {
      id: "moment-3",
      title: "Наше первое совместное путешествие",
      date: "2025-05-18",
      category: "Путешествия",
      location: "Поездка к морю • Сочи",
      lat: 43.5855,
      lng: 39.7231,
      description: "Дорога, музыка, закат и ты рядом. Сколько бы городов мы ни посетили, главное место на земле — там, где мы держимся за руки.",
      imageUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80",
      likes: 19,
      isLiked: true,
      createdAt: "2025-05-18T19:40:00Z"
    },
    {
      id: "moment-4",
      title: "Пикник на закате",
      date: "2025-07-24",
      category: "Уютные дни",
      location: "Марсово поле • Санкт-Петербург",
      lat: 59.9343,
      lng: 30.3351,
      description: "Клубника, мягкий плед и бесконечные разговоры под заходящее солнце. Самые простые моменты рядом с тобой становятся бесценными.",
      imageUrl: "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1200&q=80",
      likes: 9,
      isLiked: false,
      createdAt: "2025-07-24T20:15:00Z"
    },
    {
      id: "moment-5",
      title: "Когда мы просто дурачились",
      date: "2025-09-12",
      category: "Смешные моменты",
      location: "Дома на кухне • Москва",
      lat: 55.7512,
      lng: 37.6184,
      description: "Пытались приготовить ужин по новому рецепту, в итоге испачкались мукой и хохотали до слез. Обожаю твою непосредственность!",
      imageUrl: "https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=1200&q=80",
      likes: 15,
      isLiked: true,
      createdAt: "2025-09-12T21:00:00Z"
    }
  ];

  const CATEGORIES = [
    "Все",
    "Свидания",
    "Путешествия",
    "Уютные дни",
    "Смешные моменты",
    "Памятные даты"
  ];

  // --- 2. HELPERS & FORMATTERS ---
  function formatDateRu(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('ru-RU', options);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function compressImage(file, maxDimension = 1600, quality = 0.85) {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        return reject(new Error('Selected file is not an image'));
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              const dataUrl = canvas.toDataURL('image/jpeg', quality);
              resolve({ blob, dataUrl, width, height });
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // --- 3. TIME ENGINE & COUNTER ---
  class LoveCounter {
    constructor(startDateStr) {
      this.startDate = new Date(startDateStr);
    }
    setStartDate(dateStr) {
      this.startDate = new Date(dateStr);
    }
    getExactDifference() {
      const now = new Date();
      const diffMs = now - this.startDate;
      if (diffMs < 0) {
        return {
          totalDays: 0, years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0,
          nextAnniversaryDays: 0, anniversaryNumber: 1
        };
      }
      const totalSeconds = Math.floor(diffMs / 1000);
      const totalMinutes = Math.floor(totalSeconds / 60);
      const totalHours = Math.floor(totalMinutes / 60);
      const totalDays = Math.floor(totalHours / 24);

      let startYear = this.startDate.getFullYear();
      let startMonth = this.startDate.getMonth();
      let startDay = this.startDate.getDate();

      let nowYear = now.getFullYear();
      let nowMonth = now.getMonth();
      let nowDay = now.getDate();

      let years = nowYear - startYear;
      let months = nowMonth - startMonth;
      let days = nowDay - startDay;

      if (days < 0) {
        months -= 1;
        const prevMonth = new Date(nowYear, nowMonth, 0);
        days += prevMonth.getDate();
      }
      if (months < 0) {
        years -= 1;
        months += 12;
      }

      const hours = now.getHours();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();

      let nextAnniversary = new Date(nowYear, this.startDate.getMonth(), this.startDate.getDate());
      let anniversaryNumber = nowYear - startYear;
      if (now > nextAnniversary) {
        nextAnniversary = new Date(nowYear + 1, this.startDate.getMonth(), this.startDate.getDate());
        anniversaryNumber += 1;
      }
      const daysUntilNextAnniversary = Math.ceil((nextAnniversary - now) / (1000 * 60 * 60 * 24));

      return {
        totalDays, years, months, days, hours, minutes, seconds,
        nextAnniversaryDays: daysUntilNextAnniversary,
        anniversaryNumber
      };
    }

    static pluralize(n, one, two, five) {
      let num = Math.abs(n) % 100;
      let n1 = num % 10;
      if (num > 10 && num < 20) return five;
      if (n1 > 1 && n1 < 5) return two;
      if (n1 === 1) return one;
      return five;
    }
  }

  // --- 4. PETAL EFFECT CANVAS ---
  class PetalEffect {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.petals = [];
      this.isRunning = true;
      this.animationId = null;

      this.resize();
      window.addEventListener('resize', () => this.resize());
      this.initPetals(28);
      this.animate();
    }
    resize() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
    initPetals(count) {
      this.petals = [];
      for (let i = 0; i < count; i++) {
        this.petals.push(this.createPetal(true));
      }
    }
    createPetal(randomY = false) {
      const isHeart = Math.random() > 0.65;
      return {
        x: Math.random() * this.canvas.width,
        y: randomY ? Math.random() * this.canvas.height : -20,
        size: Math.random() * 9 + 6,
        speedY: Math.random() * 0.75 + 0.4,
        speedX: Math.random() * 0.6 - 0.3,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 1.2,
        opacity: Math.random() * 0.45 + 0.25,
        isHeart: isHeart,
        color: isHeart ? '#F43F5E' : (Math.random() > 0.5 ? '#FDA4AF' : '#FECDD3')
      };
    }
    drawHeart(ctx, x, y, size) {
      ctx.beginPath();
      const topCurveHeight = size * 0.3;
      ctx.moveTo(x, y + topCurveHeight);
      ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + topCurveHeight);
      ctx.bezierCurveTo(x - size / 2, y + (size + topCurveHeight) / 2, x, y + (size + topCurveHeight) / 2, x, y + size);
      ctx.bezierCurveTo(x, y + (size + topCurveHeight) / 2, x + size / 2, y + (size + topCurveHeight) / 2, x + size / 2, y + topCurveHeight);
      ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + topCurveHeight);
      ctx.closePath();
      ctx.fill();
    }
    drawPetal(ctx, x, y, size) {
      ctx.beginPath();
      ctx.ellipse(x, y, size, size * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    animate() {
      if (!this.isRunning) return;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      for (let p of this.petals) {
        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate((p.rotation * Math.PI) / 180);
        this.ctx.globalAlpha = p.opacity;
        this.ctx.fillStyle = p.color;
        if (p.isHeart) {
          this.drawHeart(this.ctx, -p.size / 2, -p.size / 2, p.size);
        } else {
          this.drawPetal(this.ctx, 0, 0, p.size);
        }
        this.ctx.restore();
        p.y += p.speedY;
        p.x += Math.sin(p.y * 0.01) * 0.5 + p.speedX;
        p.rotation += p.rotSpeed;
        if (p.y > this.canvas.height + 25) {
          Object.assign(p, this.createPetal(false));
        }
      }
      this.animationId = requestAnimationFrame(() => this.animate());
    }
    toggle() {
      this.isRunning = !this.isRunning;
      if (this.isRunning) {
        this.animate();
      } else {
        cancelAnimationFrame(this.animationId);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
      return this.isRunning;
    }
  }

  // --- 5. ROMANTIC AMBIENT AUDIO ---
  class AmbientAudio {
    constructor() {
      this.ctx = null;
      this.isPlaying = false;
      this.timer = null;
      this.volume = 0.25;
    }
    initContext() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }
    playTone(freq, duration = 3.5, timeOffset = 0) {
      if (!this.ctx) return;
      const now = this.ctx.currentTime + timeOffset;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(650, now);
      filter.frequency.exponentialRampToValueAtTime(120, now + duration);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(this.volume * 0.4, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration + 0.1);
    }
    startSynthAtmosphere() {
      this.initContext();
      this.isPlaying = true;
      const chords = [
        [220, 261.63, 329.63, 392.00, 440],
        [233.08, 293.66, 349.23, 440.00, 523.25],
        [174.61, 261.63, 329.63, 349.23, 440.00],
        [196.00, 246.94, 293.66, 329.63, 392.00]
      ];
      let chordIdx = 0;
      const triggerNextChord = () => {
        if (!this.isPlaying) return;
        const notes = chords[chordIdx];
        notes.forEach((freq, i) => {
          this.playTone(freq, 4.2, i * 0.22);
        });
        chordIdx = (chordIdx + 1) % chords.length;
        this.timer = setTimeout(triggerNextChord, 4600);
      };
      triggerNextChord();
    }
    stop() {
      this.isPlaying = false;
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
      if (this.ctx && this.ctx.state === 'running') {
        this.ctx.suspend().catch(() => {});
      }
    }
    toggle() {
      if (this.isPlaying) {
        this.stop();
        return false;
      } else {
        this.startSynthAtmosphere();
        return true;
      }
    }
  }

  // --- 6. STORAGE MANAGER (INDEXEDDB & SUPABASE) ---
  const DB_NAME = 'LoveStoryDB';
  const DB_VERSION = 1;
  const STORE_MOMENTS = 'moments';
  const STORE_SETTINGS = 'settings';

  class StorageManager {
    constructor() {
      this.db = null;
      this.supabaseClient = null;
    }
    async init() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(STORE_MOMENTS)) {
            db.createObjectStore(STORE_MOMENTS, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
            db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
          }
        };
        request.onsuccess = async (event) => {
          this.db = event.target.result;
          await this.seedDefaultsIfNeeded();
          await this.initSupabaseIfConfigured();
          resolve(this);
        };
        request.onerror = (event) => {
          console.error('IndexedDB error:', event.target.error);
          resolve(this); // graceful fallback
        };
      });
    }

    async seedDefaultsIfNeeded() {
      const existingMoments = await this.getAllFromStore(STORE_MOMENTS);
      if (!existingMoments || existingMoments.length === 0) {
        for (const m of INITIAL_MOMENTS) {
          await this.putToStore(STORE_MOMENTS, m);
        }
      }
      const pin = await this.getSetting('pin');
      if (!pin) {
        await this.saveSetting('pin', INITIAL_CONFIG.defaultPin);
      }
    }

    async getAllFromStore(storeName) {
      if (!this.db) return [];
      return new Promise((resolve) => {
        try {
          const tx = this.db.transaction(storeName, 'readonly');
          const store = tx.objectStore(storeName);
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => resolve([]);
        } catch (e) {
          resolve([]);
        }
      });
    }

    async putToStore(storeName, value) {
      if (!this.db) return;
      return new Promise((resolve) => {
        try {
          const tx = this.db.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);
          const req = store.put(value);
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve(null);
        } catch (e) {
          resolve(null);
        }
      });
    }

    async deleteFromStore(storeName, id) {
      if (!this.db) return;
      return new Promise((resolve) => {
        try {
          const tx = this.db.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);
          const req = store.delete(id);
          req.onsuccess = () => resolve();
          req.onerror = () => resolve();
        } catch (e) {
          resolve();
        }
      });
    }

    async getSetting(key) {
      if (!this.db) return null;
      return new Promise((resolve) => {
        try {
          const tx = this.db.transaction(STORE_SETTINGS, 'readonly');
          const store = tx.objectStore(STORE_SETTINGS);
          const req = store.get(key);
          req.onsuccess = () => resolve(req.result ? req.result.value : null);
          req.onerror = () => resolve(null);
        } catch (e) {
          resolve(null);
        }
      });
    }

    async saveSetting(key, value) {
      return this.putToStore(STORE_SETTINGS, { key, value });
    }

    async initSupabaseIfConfigured() {
      let supabaseUrl = await this.getSetting('supabase_url') || INITIAL_CONFIG.defaultSupabaseUrl;
      let supabaseKey = await this.getSetting('supabase_key') || INITIAL_CONFIG.defaultSupabaseKey;
      if (supabaseUrl && supabaseKey && window.supabase) {
        try {
          this.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
        } catch (e) {
          console.warn('Supabase initialization warning:', e);
        }
      }
    }

    isCloudConfigured() {
      return !!this.supabaseClient;
    }

    async getMoments() {
      if (this.supabaseClient) {
        try {
          const { data, error } = await this.supabaseClient
            .from('moments')
            .select('*')
            .order('date', { ascending: false });
          if (!error && Array.isArray(data)) {
            // Кэшируем полученные моменты в локальный IndexedDB для мгновенной работы и офлайна
            const remoteIds = new Set(data.map(m => m.id));
            const localMoments = await this.getAllFromStore(STORE_MOMENTS);
            for (const lm of localMoments) {
              if (['moment-1', 'moment-2', 'moment-3', 'moment-4', 'moment-5'].includes(lm.id) && !remoteIds.has(lm.id)) {
                await this.deleteFromStore(STORE_MOMENTS, lm.id);
              }
            }
            for (const m of data) {
              await this.putToStore(STORE_MOMENTS, m);
            }
            return data;
          }
        } catch (err) {
          console.warn('Supabase fetch fallback to local:', err);
        }
      }
      const moments = await this.getAllFromStore(STORE_MOMENTS);
      return moments.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    async saveMoment(moment, file = null) {
      let finalImageUrl = moment.imageUrl;
      if (file && this.supabaseClient) {
        try {
          const ext = file.name ? file.name.split('.').pop() : 'jpg';
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
          const { data, error } = await this.supabaseClient.storage
            .from('photos')
            .upload(fileName, file, { contentType: file.type || 'image/jpeg' });
          if (!error && data) {
            const { data: publicUrlData } = this.supabaseClient.storage
              .from('photos')
              .getPublicUrl(fileName);
            if (publicUrlData?.publicUrl) {
              finalImageUrl = publicUrlData.publicUrl;
            }
          }
        } catch (e) {
          console.warn('Upload error, using local dataUrl', e);
        }
      }

      const momentToSave = {
        ...moment,
        imageUrl: finalImageUrl,
        updatedAt: new Date().toISOString()
      };

      await this.putToStore(STORE_MOMENTS, momentToSave);

      if (this.supabaseClient) {
        try {
          await this.supabaseClient.from('moments').upsert(momentToSave);
        } catch (e) {}
      }
      return momentToSave;
    }

    async toggleLike(id) {
      let moments = await this.getAllFromStore(STORE_MOMENTS);
      let moment = moments.find((m) => m.id === id);

      // Если момент пришел из Telegram и еще не был в IndexedDB, запрашиваем из Supabase
      if (!moment && this.supabaseClient) {
        try {
          const { data } = await this.supabaseClient.from('moments').select('*').eq('id', id).maybeSingle();
          if (data) {
            moment = data;
            await this.putToStore(STORE_MOMENTS, moment);
          }
        } catch (e) {}
      }
      if (!moment) return null;

      moment.isLiked = !moment.isLiked;
      moment.likes = (moment.likes || 0) + (moment.isLiked ? 1 : -1);
      if (moment.likes < 0) moment.likes = 0;

      await this.putToStore(STORE_MOMENTS, moment);

      if (this.supabaseClient) {
        try {
          await this.supabaseClient.from('moments').update({
            isLiked: moment.isLiked,
            likes: moment.likes
          }).eq('id', id);
        } catch (e) {}
      }
      return moment;
    }

    async updateMomentLocation(id, location, lat, lng) {
      let moments = await this.getAllFromStore(STORE_MOMENTS);
      let moment = moments.find((m) => m.id === id);

      if (!moment && this.supabaseClient) {
        try {
          const { data } = await this.supabaseClient.from('moments').select('*').eq('id', id).maybeSingle();
          if (data) {
            moment = data;
            await this.putToStore(STORE_MOMENTS, moment);
          }
        } catch (e) {}
      }
      if (!moment) return null;

      moment.location = location;
      moment.lat = lat !== undefined && lat !== null && !isNaN(Number(lat)) ? Number(lat) : null;
      moment.lng = lng !== undefined && lng !== null && !isNaN(Number(lng)) ? Number(lng) : null;

      await this.putToStore(STORE_MOMENTS, moment);

      if (this.supabaseClient) {
        try {
          await this.supabaseClient.from('moments').update({
            location: moment.location,
            lat: moment.lat,
            lng: moment.lng
          }).eq('id', id);
        } catch (e) {
          console.warn('Supabase update location error:', e);
        }
      }
      return moment;
    }

    async deleteMoment(id, moment = null) {
      await this.deleteFromStore(STORE_MOMENTS, id);
      if (this.supabaseClient) {
        try {
          await this.supabaseClient.from('moments').delete().eq('id', id);
          if (moment && moment.imageUrl && moment.imageUrl.includes('/storage/v1/object/public/photos/')) {
            const rawName = moment.imageUrl.split('/storage/v1/object/public/photos/').pop();
            const fileName = rawName ? decodeURIComponent(rawName.split('?')[0]) : null;
            if (fileName) {
              await this.supabaseClient.storage.from('photos').remove([fileName]);
            }
          }
        } catch (e) {
          console.warn('Supabase delete error:', e);
        }
      }
    }

    async exportBackup() {
      const moments = await this.getAllFromStore(STORE_MOMENTS);
      const backup = {
        version: 1,
        exportedAt: new Date().toISOString(),
        moments
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `love-story-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }

    async importBackup(jsonData) {
      try {
        const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
        if (data.moments && Array.isArray(data.moments)) {
          for (const m of data.moments) {
            await this.putToStore(STORE_MOMENTS, m);
          }
        }
        return true;
      } catch (e) {
        return false;
      }
    }
  }

  // --- 7. CARD RENDERERS ---
  function renderTimelineCard(moment) {
    const isLiked = moment.isLiked;
    const likesCount = moment.likes || 0;
    const isCapsule = moment.isCapsule && moment.unlockDate;
    const isLocked = isCapsule && (new Date(moment.unlockDate) > new Date());
    const isAudio = (moment.imageUrl && (moment.imageUrl.endsWith('.ogg') || moment.imageUrl.endsWith('.mp3'))) || (moment.title && moment.title.startsWith('🎤'));

    let mediaContent = '';
    if (isLocked) {
      mediaContent = `
        <div class="relative overflow-hidden aspect-[16/10] sm:aspect-[16/9] bg-gradient-to-tr from-rose-950 via-rose-900 to-pink-900 flex flex-col items-center justify-center p-6 text-center select-none">
          <div class="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white mb-3 shadow-lg border border-white/30 animate-pulse">
            <i class="fa-solid fa-lock text-xl text-rose-200"></i>
          </div>
          <span class="text-xs uppercase tracking-widest font-semibold text-rose-200 mb-1">Капсула времени</span>
          <h4 class="text-white font-serif-romantic text-lg sm:text-xl font-bold mb-2">Откроется ${formatDateRu(moment.unlockDate)}</h4>
          <span class="text-xs text-rose-200/90 bg-black/40 px-3.5 py-1 rounded-full backdrop-blur-sm">🔒 Запечатано до заветной даты</span>
        </div>
      `;
    } else if (isAudio) {
      mediaContent = `
        <div class="relative overflow-hidden aspect-[16/10] sm:aspect-[16/9] bg-gradient-to-tr from-rose-500 to-pink-500 flex flex-col items-center justify-center p-6 text-white text-center">
          <div class="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white mb-3 shadow-lg border border-white/30 animate-pulse">
            <i class="fa-solid fa-microphone text-2xl"></i>
          </div>
          <h4 class="font-serif-romantic text-xl font-bold mb-2">${escapeHtml(moment.title)}</h4>
          <audio controls class="w-full max-w-md accent-rose-600 rounded-xl mt-2" src="${escapeHtml(moment.imageUrl)}"></audio>
        </div>
      `;
    } else {
      mediaContent = `
        <div class="relative overflow-hidden aspect-[16/10] sm:aspect-[16/9] bg-rose-50 cursor-pointer moment-image-trigger" data-id="${moment.id}">
          <img src="${escapeHtml(moment.imageUrl)}" alt="${escapeHtml(moment.title)}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-60"></div>
          <div class="absolute top-3 left-3 flex flex-wrap gap-2">
            <span class="px-2.5 py-1 rounded-full text-xs font-medium bg-white/90 backdrop-blur-md text-rose-700 shadow-sm">
              ${escapeHtml(moment.category || 'Воспоминание')}
            </span>
            ${moment.isCapsule ? '<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 backdrop-blur-md shadow-sm flex items-center gap-1"><i class="fa-solid fa-key text-[10px]"></i> Капсула открыта!</span>' : ''}
          </div>
          <div class="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs sm:text-sm font-medium">
            <div class="flex items-center gap-1.5 backdrop-blur-md bg-black/35 px-2.5 py-1 rounded-full">
              <i class="fa-regular fa-calendar"></i>
              <span>${formatDateRu(moment.date)}</span>
            </div>
            ${moment.location ? `
              <div class="flex items-center gap-1 backdrop-blur-md bg-black/35 px-2.5 py-1 rounded-full">
                <i class="fa-solid fa-location-dot text-rose-400"></i>
                <span class="truncate max-w-[150px]">${escapeHtml(moment.location)}</span>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }

    return `
      <div class="relative pl-6 sm:pl-10 pb-12 group last:pb-2" data-id="${moment.id}">
        <div class="absolute left-0 top-3 -ml-[1px] w-[2px] h-full bg-rose-200/80 group-last:h-4"></div>
        <div class="absolute left-0 top-2 -ml-[9px] w-5 h-5 rounded-full bg-white border-2 border-rose-500 flex items-center justify-center shadow-sm group-hover:scale-125 transition-transform duration-300">
          <i class="fa-solid fa-heart text-[8px] text-rose-500"></i>
        </div>
        <div class="glass-card glass-card-hover rounded-2xl overflow-hidden shadow-sm transition-all duration-300 border border-rose-100">
          ${mediaContent}
          <div class="p-5">
            <div class="flex items-start justify-between gap-3 mb-2">
              <h3 class="text-xl sm:text-2xl font-serif-romantic font-bold text-zinc-800 leading-tight">
                ${escapeHtml(moment.title)}
              </h3>
              <div class="flex items-center gap-1">
                <button class="like-btn flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${isLiked ? 'bg-rose-50 text-rose-600' : 'bg-zinc-50 text-zinc-500 hover:text-rose-500 hover:bg-rose-50/60'}" data-id="${moment.id}" title="Любимый момент">
                  <i class="${isLiked ? 'fa-solid text-rose-500 animate-heart-pop' : 'fa-regular'} fa-heart text-base"></i>
                  <span>${likesCount}</span>
                </button>
                <button class="delete-moment-btn p-2 text-zinc-300 hover:text-rose-500 transition-colors rounded-full hover:bg-rose-50" data-id="${moment.id}" title="Удалить">
                  <i class="fa-regular fa-trash-can text-sm"></i>
                </button>
              </div>
            </div>
            <p class="text-zinc-600 text-sm sm:text-base leading-relaxed whitespace-pre-line font-light">
              ${isLocked ? '<i>🔒 Содержимое спрятано в капсуле времени до заветного дня...</i>' : escapeHtml(moment.description || '')}
            </p>
          </div>
        </div>
      </div>
    `;
  }

  function renderGalleryCard(moment) {
    const isLiked = moment.isLiked;
    const isCapsule = moment.isCapsule && moment.unlockDate;
    const isLocked = isCapsule && (new Date(moment.unlockDate) > new Date());

    if (isLocked) {
      return `
        <div class="masonry-item relative group rounded-3xl overflow-hidden shadow-sm glass-card border border-rose-200 bg-gradient-to-tr from-rose-950 to-pink-900 p-6 flex flex-col items-center justify-center text-center text-white min-h-[220px]" data-id="${moment.id}">
          <div class="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-3 animate-pulse">
            <i class="fa-solid fa-lock text-rose-300"></i>
          </div>
          <span class="text-[10px] tracking-widest uppercase text-rose-200 font-semibold mb-1">Капсула времени</span>
          <h4 class="font-serif-romantic text-lg font-bold">${escapeHtml(moment.title)}</h4>
          <p class="text-xs text-rose-200/80 mt-1">Откроется ${formatDateRu(moment.unlockDate)}</p>
        </div>
      `;
    }

    const hasLocation = moment.location && moment.location.trim();
    const locationLabel = hasLocation ? escapeHtml(moment.location) : '+ Указать место';

    return `
      <div class="masonry-item relative group rounded-3xl overflow-hidden shadow-sm hover:shadow-xl glass-card border border-rose-100/90 transition-all duration-300 flex flex-col bg-white/95" data-id="${moment.id}">
        <!-- Photo Container -->
        <div class="relative overflow-hidden cursor-pointer moment-image-trigger" data-id="${moment.id}">
          <img src="${escapeHtml(moment.imageUrl)}" alt="${escapeHtml(moment.title)}" loading="lazy" class="w-full h-auto object-cover group-hover:scale-[1.03] transition-transform duration-500 block" />
          
          <!-- Category chip on top-left -->
          <div class="absolute top-3 left-3 z-10">
            <span class="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-black/45 backdrop-blur-md text-white border border-white/20 shadow-xs">
              ${escapeHtml(moment.category || 'Фото')}
            </span>
          </div>

          <!-- Like button on top-right -->
          <button class="like-btn absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md flex items-center justify-center text-white shadow-xs transition-transform active:scale-90" data-id="${moment.id}" onclick="event.stopPropagation()">
            <i class="${isLiked ? 'fa-solid text-rose-400' : 'fa-regular text-white'} fa-heart text-sm"></i>
          </button>
        </div>

        <!-- Always-Visible Bottom Info Bar -->
        <div class="p-3.5 sm:p-4 flex flex-col gap-1.5 border-t border-rose-50/80 bg-white/60">
          <div class="flex items-start justify-between gap-2">
            <h4 class="font-serif-romantic text-base sm:text-lg font-bold text-zinc-900 leading-snug line-clamp-1 cursor-pointer moment-image-trigger" data-id="${moment.id}">
              ${escapeHtml(moment.title)}
            </h4>
            <span class="text-[11px] text-zinc-400 shrink-0 mt-0.5 font-medium">
              ${formatDateRu(moment.date)}
            </span>
          </div>

          <!-- Location Badge / Edit button -->
          <div class="flex items-center justify-between gap-2 pt-0.5">
            <button 
              class="edit-location-trigger inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium transition-colors ${hasLocation ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100' : 'bg-zinc-100/80 hover:bg-rose-50 text-zinc-500 hover:text-rose-600 border border-dashed border-zinc-200'}" 
              data-id="${moment.id}" 
              title="${hasLocation ? 'Изменить локацию на карте' : 'Указать город или координаты для Атласа мест'}"
              onclick="event.stopPropagation()"
            >
              <i class="fa-solid fa-location-dot text-[10px] ${hasLocation ? 'text-rose-500' : 'text-zinc-400'}"></i>
              <span class="truncate max-w-[170px] sm:max-w-[210px]">${locationLabel}</span>
            </button>

            <button class="delete-moment-btn text-zinc-300 hover:text-rose-500 p-1 transition-colors" data-id="${moment.id}" title="Удалить" onclick="event.stopPropagation()">
              <i class="fa-regular fa-trash-can text-xs"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // --- 8. EXIF METADATA & REVERSE GEOCODING ENGINE ---
  class ExifGeoEngine {
    constructor() {
      this.geoCache = new Map();
    }
    async extractMetadata(file) {
      try {
        const buffer = await file.arrayBuffer();
        const view = new DataView(buffer);
        if (view.getUint16(0) !== 0xFFD8) return { hasExif: false };

        let offset = 2;
        const length = view.byteLength;
        while (offset < length) {
          if (view.getUint8(offset) !== 0xFF) break;
          const marker = view.getUint8(offset + 1);
          if (marker === 0xE1) {
            const exifHeader = view.getUint32(offset + 4);
            if (exifHeader === 0x45786966) {
              const tiffOffset = offset + 10;
              return this.parseTiff(view, tiffOffset);
            }
          }
          const markerLength = view.getUint16(offset + 2);
          offset += 2 + markerLength;
        }
        return { hasExif: false };
      } catch (err) {
        return { hasExif: false };
      }
    }
    parseTiff(view, tiffOffset) {
      const endianness = view.getUint16(tiffOffset);
      const isLittleEndian = endianness === 0x4949;
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
        dateTimeOriginal = this.readStringTag(view, subExifOffset, 0x9003, isLittleEndian, tiffOffset);
      }
      let gpsData = null;
      if (gpsIFDOffset) {
        gpsData = this.readGpsData(view, gpsIFDOffset, isLittleEndian, tiffOffset);
      }
      let parsedDate = null;
      if (dateTimeOriginal) {
        const parts = dateTimeOriginal.split(' ')[0].split(':');
        if (parts.length === 3) parsedDate = `${parts[0]}-${parts[1]}-${parts[2]}`;
      }
      return { hasExif: true, originalDate: parsedDate, gps: gpsData };
    }
    readStringTag(view, ifdOffset, targetTag, isLittleEndian, tiffOffset) {
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
      return null;
    }
    readGpsData(view, gpsOffset, isLittleEndian, tiffOffset) {
      const numEntries = view.getUint16(gpsOffset, isLittleEndian);
      let lat = null, latRef = 'N', lon = null, lonRef = 'E';
      for (let i = 0; i < numEntries; i++) {
        const entry = gpsOffset + 2 + i * 12;
        const tag = view.getUint16(entry, isLittleEndian);
        if (tag === 0x0001) latRef = String.fromCharCode(view.getUint8(entry + 8));
        else if (tag === 0x0002) lat = this.readRationalCoordinates(view, entry, isLittleEndian, tiffOffset);
        else if (tag === 0x0003) lonRef = String.fromCharCode(view.getUint8(entry + 8));
        else if (tag === 0x0004) lon = this.readRationalCoordinates(view, entry, isLittleEndian, tiffOffset);
      }
      if (lat !== null && lon !== null) {
        let finalLat = lat[0] + lat[1] / 60 + lat[2] / 3600;
        let finalLon = lon[0] + lon[1] / 60 + lon[2] / 3600;
        if (latRef === 'S') finalLat = -finalLat;
        if (lonRef === 'W') finalLon = -finalLon;
        return { lat: Number(finalLat.toFixed(6)), lng: Number(finalLon.toFixed(6)) };
      }
      return null;
    }
    readRationalCoordinates(view, entryOffset, isLittleEndian, tiffOffset) {
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
    async reverseGeocode(lat, lng) {
      const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
      if (this.geoCache.has(cacheKey)) return this.geoCache.get(cacheKey);
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1&accept-language=ru`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'ru' } });
        if (!res.ok) return null;
        const data = await res.json();
        if (data && data.address) {
          const addr = data.address;
          const city = addr.city || addr.town || addr.village || addr.municipality || addr.state;
          const place = addr.road || addr.suburb || addr.tourism || '';
          const country = addr.country || '';
          let formatted = city ? (place ? `${city}, ${place}` : (country ? `${city}, ${country}` : city)) : (data.display_name.split(',').slice(0, 2).join(','));
          this.geoCache.set(cacheKey, formatted);
          return formatted;
        }
      } catch (e) {}
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }

  // --- 9. LOVE ATLAS ENGINE (INTERACTIVE LEAFLET MAP + YANDEX MAPS ROUTING) ---
  class LoveAtlasEngine {
    constructor(onMomentClick, onEditLocationClick) {
      this.onMomentClick = onMomentClick;
      this.onEditLocationClick = onEditLocationClick;
      this.activeCityFilter = 'all';
      this.moments = [];
      this.map = null;
      this.markersLayer = null;
      this.routeLine = null;
      this.markersMap = new Map();
    }

    calculateDistanceKm(lat1, lon1, lat2, lon2) {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }

    initMapIfNeeded() {
      const mapEl = document.getElementById('interactive-atlas-map');
      if (!mapEl || this.map || typeof window.L === 'undefined') return;

      try {
        this.map = L.map('interactive-atlas-map', {
          attributionControl: false,
          zoomControl: false,
          center: [55.7558, 37.6173],
          zoom: 5
        });

        L.control.zoom({ position: 'topright' }).addTo(this.map);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: ''
        }).addTo(this.map);

        this.markersLayer = L.layerGroup().addTo(this.map);
      } catch (e) {
        console.warn('Map initialization error:', e);
      }
    }

    invalidateMapSize() {
      if (this.map) {
        setTimeout(() => {
          try {
            this.map.invalidateSize();
          } catch (e) {}
        }, 120);
      }
    }

    flyToMoment(moment) {
      if (!this.map || !moment || !moment.lat || !moment.lng) return;
      const mapEl = document.getElementById('interactive-atlas-map');
      if (mapEl) {
        mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      this.map.flyTo([moment.lat, moment.lng], 14, { duration: 1.2 });
      const marker = this.markersMap.get(moment.id);
      if (marker) {
        setTimeout(() => marker.openPopup(), 1250);
      }
    }

    render(moments) {
      this.moments = moments || [];
      const container = document.getElementById('atlas-places-container');
      const emptyState = document.getElementById('empty-atlas-state');
      const filterContainer = document.getElementById('atlas-city-filters');
      const mapEl = document.getElementById('interactive-atlas-map');
      if (!container) return;

      this.initMapIfNeeded();

      // Filter moments that have location or coordinates
      const withLoc = this.moments.filter(m => (m.location && m.location.trim()) || (m.lat && m.lng));

      if (withLoc.length === 0) {
        container.innerHTML = '';
        if (filterContainer) filterContainer.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        if (mapEl) mapEl.classList.add('hidden');
        this.updateStats(0, 0, 0, 0);
        return;
      }

      if (emptyState) emptyState.classList.add('hidden');
      if (mapEl) mapEl.classList.remove('hidden');

      // Sort chronologically
      const sorted = [...withLoc].sort((a, b) => new Date(a.date) - new Date(b.date));

      // Calculate total distance & cities
      let totalDistance = 0;
      const citiesSet = new Set();
      for (let i = 0; i < sorted.length; i++) {
        const m = sorted[i];
        if (m.location) {
          const mainCity = m.location.split('•').pop().split(',')[0].trim();
          if (mainCity) citiesSet.add(mainCity);
        }
        if (i < sorted.length - 1 && m.lat && m.lng && sorted[i + 1].lat && sorted[i + 1].lng) {
          totalDistance += this.calculateDistanceKm(m.lat, m.lng, sorted[i + 1].lat, sorted[i + 1].lng);
        }
      }

      this.updateStats(
        withLoc.length,
        citiesSet.size || 1,
        withLoc.filter(m => m.lat && m.lng).length,
        totalDistance
      );

      // Render City Filter Tabs
      if (filterContainer) {
        const citiesArr = Array.from(citiesSet);
        if (citiesArr.length > 1) {
          filterContainer.innerHTML = `
            <button class="atlas-city-pill px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              this.activeCityFilter === 'all' 
                ? 'bg-rose-500 text-white shadow-sm' 
                : 'bg-white/80 hover:bg-rose-50 text-zinc-600 border border-rose-100'
            }" data-city="all">Все локации (${withLoc.length})</button>
            ${citiesArr.map(c => `
              <button class="atlas-city-pill px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                this.activeCityFilter === c 
                  ? 'bg-rose-500 text-white shadow-sm' 
                  : 'bg-white/80 hover:bg-rose-50 text-zinc-600 border border-rose-100'
              }" data-city="${escapeHtml(c)}">${escapeHtml(c)}</button>
            `).join('')}
          `;
          filterContainer.querySelectorAll('.atlas-city-pill').forEach(btn => {
            btn.onclick = () => {
              this.activeCityFilter = btn.getAttribute('data-city');
              this.render(this.moments);
            };
          });
        } else {
          filterContainer.innerHTML = '';
        }
      }

      // Filter by city if chosen
      const displayMoments = this.activeCityFilter === 'all'
        ? sorted
        : sorted.filter(m => (m.location || '').includes(this.activeCityFilter));

      // Render interactive Leaflet Map Markers & Journey Line
      if (this.map && this.markersLayer && typeof window.L !== 'undefined') {
        this.markersLayer.clearLayers();
        this.markersMap.clear();
        if (this.routeLine) {
          try { this.map.removeLayer(this.routeLine); } catch (e) {}
          this.routeLine = null;
        }

        const geoMoments = displayMoments.filter(m => typeof m.lat === 'number' && typeof m.lng === 'number' && !isNaN(m.lat) && !isNaN(m.lng));

        geoMoments.forEach(m => {
          const heartIcon = L.divIcon({
            className: 'custom-map-heart-marker',
            html: `
              <div class="w-9 h-9 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/40 border-2 border-white cursor-pointer transition-transform hover:scale-110 active:scale-95">
                <i class="fa-solid fa-heart text-sm"></i>
              </div>
            `,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
            popupAnchor: [0, -20]
          });

          const marker = L.marker([m.lat, m.lng], { icon: heartIcon });
          const yandexUrl = `https://yandex.ru/maps/?pt=${m.lng},${m.lat}&z=16&l=map`;
          const popupHtml = `
            <div class="p-1 max-w-[210px] text-zinc-800 text-center">
              <div class="w-full h-24 rounded-xl overflow-hidden mb-2 bg-rose-50 border border-rose-100">
                <img src="${escapeHtml(m.imageUrl)}" alt="${escapeHtml(m.title)}" class="w-full h-full object-cover">
              </div>
              <h4 class="font-serif-romantic font-bold text-sm text-zinc-900 leading-tight">${escapeHtml(m.title)}</h4>
              <p class="text-[11px] text-rose-600 font-medium mt-0.5">${formatDateRu(m.date)}</p>
              <p class="text-[11px] text-zinc-500 mt-1 flex items-center justify-center gap-1">
                <i class="fa-solid fa-location-dot text-rose-500 text-[10px]"></i>
                <span class="truncate">${escapeHtml(m.location || 'Памятное место')}</span>
              </p>
              <div class="mt-2.5 flex items-center justify-center gap-1.5">
                <button class="map-popup-photo-btn px-2.5 py-1 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-semibold transition-colors" data-id="${m.id}">Фото</button>
                <a href="${yandexUrl}" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-[11px] font-semibold flex items-center gap-1 transition-colors">Яндекс</a>
              </div>
            </div>
          `;
          marker.bindPopup(popupHtml, { className: 'custom-map-popup' });
          marker.on('popupopen', () => {
            const btn = document.querySelector(`.map-popup-photo-btn[data-id="${m.id}"]`);
            if (btn) {
              btn.onclick = () => {
                if (this.onMomentClick) this.onMomentClick(m);
              };
            }
          });

          marker.addTo(this.markersLayer);
          this.markersMap.set(m.id, marker);
        });

        // Journey route polyline
        if (geoMoments.length >= 2) {
          const latlngs = geoMoments.map(m => [m.lat, m.lng]);
          this.routeLine = L.polyline(latlngs, {
            color: '#e11d48',
            weight: 3.5,
            opacity: 0.85,
            dashArray: '8, 8',
            className: 'romantic-route-line'
          }).addTo(this.map);
        }

        // View bounds
        if (geoMoments.length === 1) {
          this.map.setView([geoMoments[0].lat, geoMoments[0].lng], 13);
        } else if (geoMoments.length > 1) {
          const bounds = L.latLngBounds(geoMoments.map(m => [m.lat, m.lng]));
          this.map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
        }

        this.invalidateMapSize();
      }

      // Render Atlas Cards
      container.innerHTML = displayMoments.map((m, idx) => {
        let distanceBadge = '';
        if (idx > 0 && m.lat && m.lng && displayMoments[idx - 1].lat && displayMoments[idx - 1].lng) {
          const dist = this.calculateDistanceKm(
            displayMoments[idx - 1].lat, displayMoments[idx - 1].lng,
            m.lat, m.lng
          );
          if (dist > 5) {
            distanceBadge = `<span class="text-[11px] font-semibold text-rose-500 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md flex items-center gap-1">
              <i class="fa-solid fa-car text-[9px]"></i> +${Math.round(dist).toLocaleString('ru-RU')} км
            </span>`;
          }
        }

        let yandexUrl = '';
        if (m.lat && m.lng) {
          yandexUrl = `https://yandex.ru/maps/?pt=${m.lng},${m.lat}&z=16&l=map`;
        } else if (m.location) {
          yandexUrl = `https://yandex.ru/maps/?text=${encodeURIComponent(m.location)}`;
        }

        return `
          <div class="glass-card rounded-2xl p-4 border border-rose-100/90 hover:border-rose-300 transition-all duration-300 shadow-xs hover:shadow-md flex flex-col justify-between gap-3 bg-white/85">
            <div class="flex items-center gap-3 min-w-0">
              <div 
                class="atlas-photo-trigger w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 bg-rose-50 cursor-pointer relative group border border-rose-100"
                data-id="${m.id}"
                title="Нажмите, чтобы открыть фото во весь экран"
              >
                <img src="${escapeHtml(m.imageUrl)}" alt="${escapeHtml(m.title)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                  <i class="fa-solid fa-expand text-xs"></i>
                </div>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5 flex-wrap mb-1">
                  <span class="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-rose-50 text-rose-600 border border-rose-100">
                    ${escapeHtml(m.category || 'Воспоминание')}
                  </span>
                  <span class="text-[11px] text-zinc-400 font-medium">
                    ${formatDateRu(m.date)}
                  </span>
                  ${distanceBadge}
                </div>

                <h4 class="text-sm sm:text-base font-bold text-zinc-800 truncate font-serif-romantic">
                  ${escapeHtml(m.title)}
                </h4>

                <p class="text-xs text-zinc-600 flex items-center gap-1.5 mt-0.5 truncate">
                  <i class="fa-solid fa-location-dot text-rose-500 shrink-0 text-[11px]"></i>
                  <span class="truncate">${escapeHtml(m.location || 'Геометка сохранена')}</span>
                </p>
              </div>
            </div>

            <!-- Action buttons -->
            <div class="flex items-center gap-1.5 pt-2 border-t border-rose-50 flex-wrap justify-end">
              ${m.lat && m.lng ? `
                <button 
                  class="atlas-focus-map-btn px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors flex items-center gap-1"
                  data-id="${m.id}"
                  title="Показать на карте"
                >
                  <i class="fa-solid fa-map-pin text-[11px] text-rose-500"></i>
                  <span>На карте</span>
                </button>
              ` : ''}

              ${yandexUrl ? `
                <a 
                  href="${yandexUrl}" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  class="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-colors flex items-center gap-1"
                  title="Открыть в Яндекс Картах"
                >
                  <i class="fa-solid fa-location-arrow text-[11px] text-amber-600"></i>
                  <span>Яндекс</span>
                </a>
              ` : ''}

              <button 
                class="edit-location-trigger px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-rose-50 text-zinc-600 hover:text-rose-600 border border-rose-100 transition-colors flex items-center gap-1"
                data-id="${m.id}"
                title="Изменить город или адрес"
              >
                <i class="fa-solid fa-pen text-[10px]"></i>
                <span>Изменить</span>
              </button>

              <button 
                class="atlas-view-moment-btn px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-rose-50 text-rose-600 border border-rose-100 transition-colors flex items-center gap-1"
                data-id="${m.id}"
                title="Подробнее о моменте"
              >
                <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
              </button>
            </div>
          </div>
        `;
      }).join('');

      // Bind Clicks
      container.querySelectorAll('.atlas-photo-trigger, .atlas-view-moment-btn').forEach(el => {
        el.onclick = () => {
          const id = el.getAttribute('data-id');
          const moment = this.moments.find(m => m.id === id);
          if (moment && this.onMomentClick) {
            this.onMomentClick(moment);
          }
        };
      });

      container.querySelectorAll('.atlas-focus-map-btn').forEach(el => {
        el.onclick = () => {
          const id = el.getAttribute('data-id');
          const moment = this.moments.find(m => m.id === id);
          if (moment) {
            this.flyToMoment(moment);
          }
        };
      });

      container.querySelectorAll('.edit-location-trigger').forEach(el => {
        el.onclick = () => {
          const id = el.getAttribute('data-id');
          const moment = this.moments.find(m => m.id === id);
          if (moment && this.onEditLocationClick) {
            this.onEditLocationClick(moment);
          }
        };
      });
    }

    updateStats(places, cities, photos, distance) {
      const elPlaces = document.getElementById('map-stats-places');
      const elCities = document.getElementById('map-stats-cities');
      const elPhotos = document.getElementById('map-stats-photos');
      const elDist = document.getElementById('map-stats-distance');
      if (elPlaces) elPlaces.innerText = places;
      if (elCities) elCities.innerText = cities;
      if (elPhotos) elPhotos.innerText = photos;
      if (elDist) elDist.innerText = distance > 0 ? `${Math.round(distance).toLocaleString('ru-RU')} км` : '0 км';
    }
  }

  // --- 10. PHOTOBOOK SPREADS COMPILER ---
  class PhotobookGenerator {
    generateSpreads(moments, config = {}) {
      const startDate = config.startDate || '2024-12-21';
      const sorted = [...moments].sort((a, b) => new Date(a.date) - new Date(b.date));
      const spreads = [
        this.renderCoverSpread(startDate, sorted.length),
        this.renderDedicationSpread(config.quote),
        ...this.renderMomentSpreads(sorted),
        this.renderBackCoverSpread()
      ];
      return spreads.join('');
    }
    renderCoverSpread(startDate, totalMoments) {
      return `
        <div class="photobook-page flex flex-col items-center justify-between p-12 text-center bg-[#FAF4F0] border-4 border-[#E8DCD5] rounded-xl shadow-lg relative min-h-[480px]">
          <div class="absolute inset-4 border border-[#D5C2B8] pointer-events-none"></div>
          <div class="mt-4">
            <span class="text-xs uppercase tracking-[0.3em] text-[#9A7B70] font-semibold">Архив воспоминаний</span>
            <div class="w-12 h-0.5 bg-[#C9A99D] mx-auto mt-2"></div>
          </div>
          <div class="my-auto py-6">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-tr from-rose-500 to-pink-400 flex items-center justify-center text-white shadow-xl">
              <i class="fa-solid fa-heart text-2xl"></i>
            </div>
            <h1 class="text-4xl sm:text-5xl font-serif-romantic font-bold text-[#3E302B] mb-2">Наша История</h1>
            <p class="text-sm font-serif-romantic text-[#7D645B] italic">Том I • с 21 декабря 2024 года</p>
          </div>
          <div class="mb-4">
            <p class="text-xs text-[#9A7B70] tracking-widest font-medium uppercase">Коллекция из ${totalMoments} памятных моментов</p>
          </div>
        </div>
      `;
    }
    renderDedicationSpread(quote) {
      return `
        <div class="photobook-page grid grid-cols-1 sm:grid-cols-2 gap-8 p-10 bg-white border border-rose-100 rounded-xl shadow-md min-h-[480px]">
          <div class="flex flex-col items-center justify-center p-6 border-r border-rose-50 text-center">
            <div class="w-24 h-24 rounded-full border border-rose-200 p-2 mb-4">
              <div class="w-full h-full rounded-full bg-rose-50 flex items-center justify-center text-rose-400">
                <i class="fa-solid fa-infinity text-2xl"></i>
              </div>
            </div>
            <h3 class="font-serif-romantic text-2xl font-bold text-zinc-800 mb-1">21.12.2024</h3>
            <p class="text-xs text-zinc-400 uppercase tracking-widest">День, когда всё началось</p>
          </div>
          <div class="flex flex-col justify-center p-6 text-center sm:text-left">
            <span class="text-xs text-rose-500 uppercase tracking-widest font-semibold mb-3">Посвящение</span>
            <p class="font-handwriting text-3xl text-zinc-700 leading-relaxed mb-4">
              «${quote || 'В тебе есть весь мой мир, всё мое счастье и всё моё спокойствие.'}»
            </p>
            <div class="w-16 h-0.5 bg-rose-300 mb-3"></div>
            <p class="text-xs text-zinc-400 leading-relaxed font-light">
              Эта книга — наше осязаемое доказательство того, сколько тепла, смеха, путешествий и объятий мы разделили друг с другом.
            </p>
          </div>
        </div>
      `;
    }
    renderMomentSpreads(moments) {
      const spreads = [];
      let pageNum = 1;
      for (let i = 0; i < moments.length; i += 2) {
        const m1 = moments[i];
        const m2 = moments[i + 1] || null;
        const leftPageNum = pageNum++;
        const rightPageNum = pageNum++;
        spreads.push(`
          <div class="photobook-page grid grid-cols-1 sm:grid-cols-2 gap-6 p-8 bg-white border border-rose-100 rounded-xl shadow-md min-h-[480px] relative">
            <div class="flex flex-col h-full justify-between bg-[#FAF7F5] rounded-2xl p-5 border border-rose-100/60 overflow-hidden relative">
              <div>
                <div class="aspect-[16/11] rounded-xl overflow-hidden mb-4 bg-zinc-100 shadow-sm relative group">
                  <img src="${escapeHtml(m1.imageUrl)}" alt="${escapeHtml(m1.title)}" class="w-full h-full object-cover" />
                  <span class="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/90 text-rose-600 backdrop-blur-sm shadow-xs">${escapeHtml(m1.category || 'Воспоминание')}</span>
                </div>
                <div class="flex items-center justify-between text-xs text-rose-600 font-medium mb-1">
                  <span>${formatDateRu(m1.date)}</span>
                  ${m1.location ? `<span class="truncate max-w-[140px] text-zinc-500">📍 ${escapeHtml(m1.location)}</span>` : ''}
                </div>
                <h3 class="font-serif-romantic text-xl font-bold text-zinc-800 mb-2 leading-tight">${escapeHtml(m1.title)}</h3>
                <p class="text-xs sm:text-sm text-zinc-600 leading-relaxed font-light line-clamp-4">${escapeHtml(m1.description || '')}</p>
              </div>
              <div class="pt-3 border-t border-rose-100/50 flex justify-between items-center text-[10px] text-zinc-400 font-serif-romantic">
                <span>Наша История</span>
                <span>— ${leftPageNum} —</span>
              </div>
            </div>
            ${m2 ? `
              <div class="flex flex-col h-full justify-between bg-[#FAF7F5] rounded-2xl p-5 border border-rose-100/60 overflow-hidden relative">
                <div>
                  <div class="aspect-[16/11] rounded-xl overflow-hidden mb-4 bg-zinc-100 shadow-sm relative group">
                    <img src="${escapeHtml(m2.imageUrl)}" alt="${escapeHtml(m2.title)}" class="w-full h-full object-cover" />
                    <span class="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/90 text-rose-600 backdrop-blur-sm shadow-xs">${escapeHtml(m2.category || 'Воспоминание')}</span>
                  </div>
                  <div class="flex items-center justify-between text-xs text-rose-600 font-medium mb-1">
                    <span>${formatDateRu(m2.date)}</span>
                    ${m2.location ? `<span class="truncate max-w-[140px] text-zinc-500">📍 ${escapeHtml(m2.location)}</span>` : ''}
                  </div>
                  <h3 class="font-serif-romantic text-xl font-bold text-zinc-800 mb-2 leading-tight">${escapeHtml(m2.title)}</h3>
                  <p class="text-xs sm:text-sm text-zinc-600 leading-relaxed font-light line-clamp-4">${escapeHtml(m2.description || '')}</p>
                </div>
                <div class="pt-3 border-t border-rose-100/50 flex justify-between items-center text-[10px] text-zinc-400 font-serif-romantic">
                  <span>— ${rightPageNum} —</span>
                  <span>Семейный архив</span>
                </div>
              </div>
            ` : `
              <div class="flex flex-col items-center justify-center p-8 text-center rounded-2xl border-2 border-dashed border-rose-200">
                <i class="fa-solid fa-heart text-rose-300 text-3xl mb-3 animate-pulse"></i>
                <p class="font-serif-romantic text-lg font-bold text-zinc-700">Каждый день с тобой — это новая глава</p>
                <p class="text-xs text-zinc-400 mt-1">Место для следующего совместного фото...</p>
                <span class="text-[10px] text-zinc-300 mt-6 font-serif-romantic">— ${rightPageNum} —</span>
              </div>
            `}
          </div>
        `);
      }
      return spreads;
    }
    renderBackCoverSpread() {
      return `
        <div class="photobook-page flex flex-col items-center justify-between p-12 text-center bg-[#FAF4F0] border-4 border-[#E8DCD5] rounded-xl shadow-lg relative min-h-[480px]">
          <div class="absolute inset-4 border border-[#D5C2B8] pointer-events-none"></div>
          <div></div>
          <div class="my-auto">
            <div class="w-12 h-12 mx-auto mb-4 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shadow-sm">
              <i class="fa-solid fa-heart text-xl"></i>
            </div>
            <h2 class="text-3xl font-serif-romantic font-bold text-[#3E302B] mb-2">Продолжение следует...</h2>
            <p class="font-handwriting text-2xl text-[#7D645B]">Я люблю тебя всё сильнее с каждым днем</p>
          </div>
          <div class="text-[11px] text-[#9A7B70] tracking-wider uppercase">
            Напечатано специально для нас двоих • 2026
          </div>
        </div>
      `;
    }
  }

  // --- 12. MAIN APP CONTROLLER ---
  class LoveStoryApp {
    constructor() {
      this.moments = [];
      this.currentView = 'gallery';
      this.currentFilter = 'Все';
      this.searchQuery = '';
      this.currentPinInput = '';
      this.correctPin = INITIAL_CONFIG.defaultPin;
      this.isUnlocked = false;
      this.failedPinAttempts = 0;
      this.lockoutUntil = 0;
      this.counter = null;
      this.petals = null;
      this.audio = new AmbientAudio();
      this.storage = new StorageManager();
      this.exifEngine = new ExifGeoEngine();
      this.atlasEngine = new LoveAtlasEngine(
        (m) => this.openLightbox(m),
        (m) => this.openEditLocationModal(m)
      );
      this.photobook = new PhotobookGenerator();
      this.activeLightboxMoment = null;
      this.uploadedImageBlob = null;
      this.uploadedImageDataUrl = null;
      this.slideshowTimer = null;
      this.slideshowIndex = 0;
      this.isSlideshowPlaying = false;
      this.slideshowList = [];
      this.locationSearchTimeout = null;
    }

    async init() {
      // 1. Theme initialization
      const savedTheme = localStorage.getItem('love_theme');
      if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        const themeBtn = document.getElementById('theme-toggle-btn');
        if (themeBtn) {
          themeBtn.innerHTML = '<i class="fa-solid fa-sun text-sm text-amber-400"></i>';
        }
      }

      await this.storage.init();
      const savedPin = await this.storage.getSetting('pin');
      this.correctPin = savedPin || INITIAL_CONFIG.defaultPin;

      const savedStartDate = await this.storage.getSetting('start_date') || INITIAL_CONFIG.startDate;
      this.counter = new LoveCounter(savedStartDate);

      this.petals = new PetalEffect('petals-canvas');

      const rememberedDevice = localStorage.getItem('love_app_remember_device');
      const sessionUnlocked = sessionStorage.getItem('app_unlocked');
      if (rememberedDevice === 'true' || sessionUnlocked === 'true') {
        this.unlockApp(false);
      } else {
        this.setupLockScreen();
      }

      this.setupGlobalEvents();
      this.setupLocationModal();
      this.setupCounterTimer();
    }

    setupLockScreen() {
      const lockScreen = document.getElementById('lock-screen');
      lockScreen.classList.remove('hidden');

      const keypadBtns = document.querySelectorAll('.keypad-btn');
      keypadBtns.forEach(btn => {
        btn.onclick = () => {
          if (Date.now() < this.lockoutUntil) {
            const sec = Math.ceil((this.lockoutUntil - Date.now()) / 1000);
            alert(`Ввод заблокирован из-за неверных попыток. Подождите ${sec} сек.`);
            return;
          }
          const val = btn.getAttribute('data-val');
          if (val === 'back') {
            this.currentPinInput = this.currentPinInput.slice(0, -1);
          } else if (val === 'clear') {
            this.currentPinInput = '';
          } else if (this.currentPinInput.length < 4) {
            this.currentPinInput += val;
          }
          this.updatePinDots();
          if (this.currentPinInput.length === 4) {
            setTimeout(() => this.verifyPin(), 150);
          }
        };
      });

      window.onkeydown = (e) => {
        if (this.isUnlocked) return;
        if (Date.now() < this.lockoutUntil) return;
        if (e.key >= '0' && e.key <= '9') {
          if (this.currentPinInput.length < 4) {
            this.currentPinInput += e.key;
            this.updatePinDots();
            if (this.currentPinInput.length === 4) {
              setTimeout(() => this.verifyPin(), 150);
            }
          }
        } else if (e.key === 'Backspace') {
          this.currentPinInput = this.currentPinInput.slice(0, -1);
          this.updatePinDots();
        }
      };
    }

    updatePinDots() {
      const dots = document.querySelectorAll('.pin-dot');
      dots.forEach((dot, index) => {
        if (index < this.currentPinInput.length) {
          dot.classList.add('filled');
        } else {
          dot.classList.remove('filled');
        }
      });
    }

    verifyPin() {
      if (Date.now() < this.lockoutUntil) {
        const sec = Math.ceil((this.lockoutUntil - Date.now()) / 1000);
        alert(`Ввод заблокирован из-за неверных попыток. Подождите ${sec} сек.`);
        this.currentPinInput = '';
        this.updatePinDots();
        return;
      }

      if (this.currentPinInput === this.correctPin) {
        this.failedPinAttempts = 0;
        sessionStorage.setItem('app_unlocked', 'true');
        const remCheckbox = document.getElementById('remember-device-checkbox');
        if (remCheckbox && remCheckbox.checked) {
          localStorage.setItem('love_app_remember_device', 'true');
        }
        this.unlockApp(true);
      } else {
        this.failedPinAttempts = (this.failedPinAttempts || 0) + 1;
        const container = document.getElementById('pin-display');
        container.classList.add('animate-shake');

        if (this.failedPinAttempts >= 5) {
          this.lockoutUntil = Date.now() + 30000;
          setTimeout(() => {
            alert('Слишком много неверных попыток ввода PIN-кода. Ввод заблокирован на 30 секунд.');
          }, 350);
        }

        setTimeout(() => {
          container.classList.remove('animate-shake');
          this.currentPinInput = '';
          this.updatePinDots();
        }, 500);
      }
    }

    async unlockApp(animate = true) {
      this.isUnlocked = true;
      const lockScreen = document.getElementById('lock-screen');
      const mainContent = document.getElementById('main-content');

      if (animate) {
        lockScreen.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
        setTimeout(() => {
          lockScreen.classList.add('hidden');
        }, 500);
      } else {
        lockScreen.classList.add('hidden');
      }

      mainContent.classList.remove('hidden');
      await this.loadAndRenderAll();
    }

    async loadAndRenderAll() {
      this.moments = await this.storage.getMoments();
      this.updateHeroStats();
      this.renderCategoryPills();
      this.renderFlashback();
      this.syncMobileNavActive();
      this.renderCurrentView();
      this.updateCloudStatusIndicator();
    }

    updateHeroStats() {
      const photosEl = document.getElementById('hero-stat-photos');
      const placesEl = document.getElementById('hero-stat-places');
      const likedEl = document.getElementById('hero-stat-liked');
      const capsulesEl = document.getElementById('hero-stat-capsules');
      const countPill = document.getElementById('hero-photos-count');

      const moments = this.moments || [];
      const totalPhotos = moments.length;
      let totalLiked = 0;
      let totalCapsules = 0;
      const citiesSet = new Set();

      moments.forEach(m => {
        if (m.isLiked) totalLiked++;
        if (m.isCapsule) totalCapsules++;
        if (m.location) {
          const city = m.location.split('•').pop().split(',')[0].trim();
          if (city) citiesSet.add(city);
        }
      });

      if (photosEl) photosEl.textContent = totalPhotos;
      if (placesEl) placesEl.textContent = citiesSet.size || (totalPhotos > 0 ? 1 : 0);
      if (likedEl) likedEl.textContent = totalLiked;
      if (capsulesEl) capsulesEl.textContent = totalCapsules;
      if (countPill) countPill.textContent = `${totalPhotos} фото`;
    }

    renderFlashback() {
      const widget = document.getElementById('flashback-widget');
      if (!widget) return;
      if (!this.moments || this.moments.length === 0) {
        widget.classList.add('hidden');
        return;
      }

      const today = new Date().toISOString().slice(5, 10); // "MM-DD"
      // 1. Проверяем совпадение даты (месяц и день) с прошлыми датами
      let match = this.moments.find(m => m.date && m.date.slice(5) === today && m.date !== new Date().toISOString().slice(0, 10));
      let badge = 'В этот день в нашей истории';

      // 2. Если сегодня точных совпадений нет — берем любимый момент
      if (!match) {
        const liked = this.moments.filter(m => m.isLiked && m.imageUrl);
        if (liked.length > 0) {
          match = liked[Math.floor(Math.random() * liked.length)];
          badge = 'Любимое воспоминание дня';
        }
      }

      // 3. Либо любое яркое фото из архива
      if (!match) {
        const withImg = this.moments.filter(m => m.imageUrl);
        if (withImg.length > 0) {
          match = withImg[Math.floor(Math.random() * withImg.length)];
          badge = 'Воспоминание из нашего архива';
        }
      }

      if (!match) {
        widget.classList.add('hidden');
        return;
      }

      const badgeEl = document.getElementById('flashback-badge-text');
      const titleEl = document.getElementById('flashback-title');
      const dateEl = document.getElementById('flashback-date');
      const imgEl = document.getElementById('flashback-img');
      const openBtn = document.getElementById('flashback-open-btn');
      const thumb = document.getElementById('flashback-thumb');

      if (badgeEl) badgeEl.innerText = badge;
      if (titleEl) titleEl.innerText = match.title;
      if (dateEl) dateEl.innerText = `${formatDateRu(match.date)}${match.location ? ' • ' + match.location : ''}`;
      if (imgEl) imgEl.src = match.imageUrl;

      const triggerOpen = () => this.openLightbox(match);
      if (openBtn) openBtn.onclick = triggerOpen;
      if (thumb) thumb.onclick = triggerOpen;

      widget.classList.remove('hidden');
    }

    renderCategoryPills() {
      const container = document.getElementById('category-pills');
      if (!container) return;
      const pills = [
        { id: 'Все', label: 'Все' },
        { id: '❤️ Любимые', label: '❤️ Любимые' },
        ...CATEGORIES.slice(1).map(c => ({ id: c, label: c }))
      ];

      container.innerHTML = pills.map(p => `
        <button class="category-pill whitespace-nowrap px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
          this.currentFilter === p.id 
            ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25' 
            : 'bg-white/80 text-zinc-600 hover:bg-rose-50 border border-rose-100'
        }" data-cat="${p.id}">
          ${p.label}
        </button>
      `).join('');

      container.querySelectorAll('.category-pill').forEach(btn => {
        btn.onclick = () => {
          this.currentFilter = btn.getAttribute('data-cat');
          this.renderCategoryPills();
          this.syncMobileNavActive();
          this.renderCurrentView();
        };
      });
    }

    switchView(viewName) {
      this.currentView = viewName;
      document.querySelectorAll('.view-tab-btn').forEach(b => {
        const matches = b.getAttribute('data-view') === viewName;
        b.classList.toggle('active', matches);
        b.classList.toggle('bg-rose-500', matches);
        b.classList.toggle('text-white', matches);
        b.classList.toggle('shadow-md', matches);
        b.classList.toggle('text-zinc-600', !matches);
        b.classList.toggle('hover:text-rose-600', !matches);
      });
      this.syncMobileNavActive();
      this.renderCurrentView();
      if (viewName === 'map' && this.atlasEngine) {
        this.atlasEngine.invalidateMapSize();
      }
    }

    syncMobileNavActive() {
      document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
        const v = btn.getAttribute('data-view');
        const f = btn.getAttribute('data-filter');
        let isActive = false;
        if (f && (this.currentFilter === '❤️ Любимые' || this.currentFilter === 'Любимые')) {
          isActive = true;
        } else if (v && v === this.currentView && this.currentFilter !== '❤️ Любимые') {
          isActive = true;
        }
        btn.classList.toggle('active', isActive);
        btn.classList.toggle('text-rose-600', isActive);
        btn.classList.toggle('text-zinc-400', !isActive);
      });
    }

    getFilteredMoments() {
      let list = this.moments;
      if (this.currentFilter === '❤️ Любимые' || this.currentFilter === 'Любимые') {
        list = list.filter(m => m.isLiked);
      } else if (this.currentFilter !== 'Все') {
        list = list.filter(m => m.category === this.currentFilter);
      }

      if (this.searchQuery && this.searchQuery.trim()) {
        const q = this.searchQuery.trim().toLowerCase();
        list = list.filter(m => {
          return (
            (m.title && m.title.toLowerCase().includes(q)) ||
            (m.description && m.description.toLowerCase().includes(q)) ||
            (m.location && m.location.toLowerCase().includes(q)) ||
            (m.category && m.category.toLowerCase().includes(q))
          );
        });
      }

      return list;
    }

    renderCurrentView() {
      const timelineView = document.getElementById('timeline-view');
      const galleryView = document.getElementById('gallery-view');
      const mapView = document.getElementById('map-view');
      const filterSection = document.getElementById('filter-section');

      timelineView.classList.add('hidden');
      galleryView.classList.add('hidden');
      if (mapView) mapView.classList.add('hidden');

      if (this.currentView === 'timeline') {
        timelineView.classList.remove('hidden');
        filterSection.classList.remove('hidden');
        this.renderTimeline();
      } else if (this.currentView === 'gallery') {
        galleryView.classList.remove('hidden');
        filterSection.classList.remove('hidden');
        this.renderGallery();
      } else if (this.currentView === 'map') {
        if (mapView) {
          mapView.classList.remove('hidden');
          filterSection.classList.remove('hidden');
          this.renderMap();
        }
      }
    }

    renderMap() {
      const filtered = this.getFilteredMoments();
      this.atlasEngine.render(filtered);
    }

    renderTimeline() {
      const list = document.getElementById('timeline-list');
      const emptyState = document.getElementById('empty-timeline-state');
      const filtered = this.getFilteredMoments();

      if (filtered.length === 0) {
        list.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
      }
      emptyState.classList.add('hidden');
      list.innerHTML = filtered.map(m => renderTimelineCard(m)).join('');
      this.bindMomentActions();
    }

    renderGallery() {
      const grid = document.getElementById('masonry-grid');
      const emptyState = document.getElementById('empty-gallery-state');
      const filtered = this.getFilteredMoments();

      if (filtered.length === 0) {
        grid.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
      }
      emptyState.classList.add('hidden');
      grid.innerHTML = filtered.map(m => renderGalleryCard(m)).join('');
      this.bindMomentActions();
    }

    bindMomentActions() {
      document.querySelectorAll('.like-btn').forEach(btn => {
        btn.onclick = async (e) => {
          e.stopPropagation();
          const id = btn.getAttribute('data-id');
          const updated = await this.storage.toggleLike(id);
          if (updated) {
            const idx = this.moments.findIndex(m => m.id === id);
            if (idx !== -1) this.moments[idx] = updated;
            this.updateHeroStats();
            this.renderCurrentView();
          }
        };
      });

      document.querySelectorAll('.delete-moment-btn').forEach(btn => {
        btn.onclick = async (e) => {
          e.stopPropagation();
          if (confirm('Точно удалить это воспоминание?')) {
            const id = btn.getAttribute('data-id');
            const momentToDelete = this.moments.find(m => m.id === id);
            await this.storage.deleteMoment(id, momentToDelete);
            this.moments = await this.storage.getMoments();
            this.updateHeroStats();
            this.renderCurrentView();
          }
        };
      });

      document.querySelectorAll('.moment-image-trigger').forEach(el => {
        el.onclick = () => {
          const id = el.getAttribute('data-id');
          const moment = this.moments.find(m => m.id === id);
          if (moment) this.openLightbox(moment);
        };
      });

      document.querySelectorAll('.edit-location-trigger').forEach(el => {
        el.onclick = (e) => {
          e.stopPropagation();
          const id = el.getAttribute('data-id');
          const moment = this.moments.find(m => m.id === id);
          if (moment) this.openEditLocationModal(moment);
        };
      });
    }

    setupCounterTimer() {
      const update = () => {
        if (!this.counter) return;
        const stats = this.counter.getExactDifference();

        const elTotalDays = document.getElementById('counter-total-days');
        if (elTotalDays) elTotalDays.innerText = stats.totalDays.toLocaleString('ru-RU');

        const elMiniCounter = document.getElementById('header-mini-counter-text');
        if (elMiniCounter) elMiniCounter.innerText = `Вместе ${stats.totalDays.toLocaleString('ru-RU')} дн. 💖`;

        const elYears = document.getElementById('counter-years');
        const elMonths = document.getElementById('counter-months');
        const elDays = document.getElementById('counter-days');
        const elHours = document.getElementById('counter-hours');
        const elMinutes = document.getElementById('counter-minutes');
        const elSeconds = document.getElementById('counter-seconds');

        if (elYears) elYears.innerText = stats.years;
        if (elMonths) elMonths.innerText = stats.months;
        if (elDays) elDays.innerText = stats.days;
        if (elHours) elHours.innerText = String(stats.hours).padStart(2, '0');
        if (elMinutes) elMinutes.innerText = String(stats.minutes).padStart(2, '0');
        if (elSeconds) elSeconds.innerText = String(stats.seconds).padStart(2, '0');

        const elAnniversary = document.getElementById('next-anniversary-badge');
        if (elAnniversary) {
          elAnniversary.innerText = `До следующей годовщины (${stats.anniversaryNumber} года): ${stats.nextAnniversaryDays} ${LoveCounter.pluralize(stats.nextAnniversaryDays, 'день', 'дня', 'дней')}`;
        }
      };
      update();
      setInterval(update, 1000);

      // Scroll listener for sticky mini counter
      window.addEventListener('scroll', () => {
        const miniBtn = document.getElementById('header-mini-counter');
        if (miniBtn) {
          if (window.scrollY > 280) {
            miniBtn.classList.remove('hidden');
            miniBtn.classList.add('sm:flex');
          } else {
            miniBtn.classList.add('hidden');
            miniBtn.classList.remove('sm:flex');
          }
        }
      }, { passive: true });
    }

    openLightbox(moment) {
      this.activeLightboxMoment = moment;
      const modal = document.getElementById('lightbox-modal');
      const img = document.getElementById('lightbox-img');
      const title = document.getElementById('lightbox-title');
      const date = document.getElementById('lightbox-date');
      const desc = document.getElementById('lightbox-desc');
      const downloadBtn = document.getElementById('lightbox-download-btn');

      img.src = moment.imageUrl;
      title.innerText = moment.title;
      date.innerText = `${formatDateRu(moment.date)} ${moment.location ? '• ' + moment.location : ''}`;
      desc.innerText = moment.description || '';

      downloadBtn.href = moment.imageUrl;
      downloadBtn.download = `${moment.title || 'photo'}.jpg`;

      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }

    closeLightbox() {
      const modal = document.getElementById('lightbox-modal');
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      this.activeLightboxMoment = null;
    }

    navigateLightbox(direction) {
      if (!this.activeLightboxMoment) return;
      const list = this.getFilteredMoments();
      const curIdx = list.findIndex(m => m.id === this.activeLightboxMoment.id);
      if (curIdx === -1) return;

      let nextIdx = curIdx + direction;
      if (nextIdx < 0) nextIdx = list.length - 1;
      if (nextIdx >= list.length) nextIdx = 0;

      this.openLightbox(list[nextIdx]);
    }

    // --- SLIDESHOW CONTROLLER ---
    startSlideshow() {
      const list = this.getFilteredMoments().filter(m => m.imageUrl);
      if (list.length === 0) {
        alert('В текущей выборке пока нет фотографий для показа.');
        return;
      }
      this.slideshowList = list;
      this.slideshowIndex = 0;
      this.isSlideshowPlaying = true;

      const modal = document.getElementById('slideshow-modal');
      modal.classList.remove('hidden');
      modal.classList.add('flex');

      // Auto-start background music
      if (!this.audio.isPlaying) {
        this.audio.startSynthAtmosphere();
        const musicBtn = document.getElementById('music-toggle-btn');
        if (musicBtn) {
          musicBtn.classList.add('bg-rose-500', 'text-white', 'animate-pulse');
          musicBtn.classList.remove('bg-white/80', 'text-zinc-700');
          musicBtn.querySelector('i').className = 'fa-solid fa-volume-high';
        }
      }

      this.showSlide(0);
      this.scheduleNextSlide();
    }

    stopSlideshow() {
      if (this.slideshowTimer) {
        clearInterval(this.slideshowTimer);
        this.slideshowTimer = null;
      }
      this.isSlideshowPlaying = false;
      const modal = document.getElementById('slideshow-modal');
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }

    showSlide(idx) {
      if (!this.slideshowList || this.slideshowList.length === 0) return;
      if (idx < 0) idx = this.slideshowList.length - 1;
      if (idx >= this.slideshowList.length) idx = 0;
      this.slideshowIndex = idx;

      const moment = this.slideshowList[idx];
      const img = document.getElementById('slideshow-img');
      const title = document.getElementById('slideshow-title');
      const meta = document.getElementById('slideshow-meta');
      const desc = document.getElementById('slideshow-desc');
      const progress = document.getElementById('slideshow-progress');

      if (img) {
        img.classList.remove('slideshow-active-img');
        img.src = moment.imageUrl;
        setTimeout(() => img.classList.add('slideshow-active-img'), 40);
      }
      if (title) title.innerText = moment.title;
      if (meta) meta.innerText = `${formatDateRu(moment.date)} ${moment.location ? '• ' + moment.location : ''}`;
      if (desc) {
        desc.innerText = moment.description || '';
        desc.classList.toggle('hidden', !moment.description);
      }
      if (progress) {
        const pct = Math.round(((idx + 1) / this.slideshowList.length) * 100);
        progress.style.width = `${pct}%`;
      }
    }

    scheduleNextSlide() {
      if (this.slideshowTimer) clearInterval(this.slideshowTimer);
      if (!this.isSlideshowPlaying) return;
      this.slideshowTimer = setInterval(() => {
        this.showSlide(this.slideshowIndex + 1);
      }, 5000);
    }

    toggleSlideshowPlay() {
      this.isSlideshowPlaying = !this.isSlideshowPlaying;
      const btn = document.getElementById('slideshow-play-pause-btn');
      if (btn) {
        btn.innerHTML = this.isSlideshowPlaying
          ? '<i class="fa-solid fa-pause text-base"></i>'
          : '<i class="fa-solid fa-play text-base ml-0.5"></i>';
      }
      if (this.isSlideshowPlaying) {
        this.scheduleNextSlide();
      } else if (this.slideshowTimer) {
        clearInterval(this.slideshowTimer);
        this.slideshowTimer = null;
      }
    }

    prevSlide() {
      this.showSlide(this.slideshowIndex - 1);
      if (this.isSlideshowPlaying) this.scheduleNextSlide();
    }

    nextSlide() {
      this.showSlide(this.slideshowIndex + 1);
      if (this.isSlideshowPlaying) this.scheduleNextSlide();
    }

    setupGlobalEvents() {
      // Desktop Tab view buttons
      document.querySelectorAll('.view-tab-btn').forEach(btn => {
        btn.onclick = () => {
          const view = btn.getAttribute('data-view');
          this.switchView(view);
        };
      });

      // Mobile Bottom Nav buttons
      document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
        btn.onclick = () => {
          const view = btn.getAttribute('data-view');
          const filter = btn.getAttribute('data-filter');
          if (filter) {
            this.currentFilter = filter;
            this.renderCategoryPills();
            this.syncMobileNavActive();
            this.renderCurrentView();
          } else if (view) {
            this.switchView(view);
          }
        };
      });

      const mobileQuickAdd = document.getElementById('mobile-quick-add-btn');
      if (mobileQuickAdd) {
        mobileQuickAdd.onclick = () => {
          document.getElementById('open-add-moment-btn')?.click();
        };
      }

      // Sticky header mini counter back to top
      const miniCounterBtn = document.getElementById('header-mini-counter');
      if (miniCounterBtn) {
        miniCounterBtn.onclick = () => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        };
      }

      // Velvet / Dark Mode Toggle
      const themeBtn = document.getElementById('theme-toggle-btn');
      if (themeBtn) {
        themeBtn.onclick = () => {
          const isDark = document.body.classList.toggle('dark-theme');
          themeBtn.innerHTML = isDark
            ? '<i class="fa-solid fa-sun text-sm text-amber-400"></i>'
            : '<i class="fa-solid fa-moon text-sm"></i>';
          localStorage.setItem('love_theme', isDark ? 'dark' : 'light');
        };
      }

      // Search Bar
      const searchInput = document.getElementById('moment-search-input');
      const clearSearchBtn = document.getElementById('clear-search-btn');
      let searchTimeout = null;
      if (searchInput) {
        searchInput.oninput = (e) => {
          clearTimeout(searchTimeout);
          searchTimeout = setTimeout(() => {
            this.searchQuery = e.target.value;
            if (clearSearchBtn) {
              clearSearchBtn.classList.toggle('hidden', !this.searchQuery);
            }
            this.renderCurrentView();
          }, 150);
        };
      }
      if (clearSearchBtn) {
        clearSearchBtn.onclick = () => {
          if (searchInput) searchInput.value = '';
          this.searchQuery = '';
          clearSearchBtn.classList.add('hidden');
          this.renderCurrentView();
        };
      }

      // Slideshow triggers
      const startSlideshowBtn = document.getElementById('start-slideshow-btn');
      if (startSlideshowBtn) startSlideshowBtn.onclick = () => this.startSlideshow();

      const closeSlideshowBtn = document.getElementById('slideshow-close-btn');
      if (closeSlideshowBtn) closeSlideshowBtn.onclick = () => this.stopSlideshow();

      const playPauseBtn = document.getElementById('slideshow-play-pause-btn');
      if (playPauseBtn) playPauseBtn.onclick = () => this.toggleSlideshowPlay();

      const prevSlideBtn = document.getElementById('slideshow-prev-btn');
      if (prevSlideBtn) prevSlideBtn.onclick = () => this.prevSlide();

      const nextSlideBtn = document.getElementById('slideshow-next-btn');
      if (nextSlideBtn) nextSlideBtn.onclick = () => this.nextSlide();

      const slideshowMusicBtn = document.getElementById('slideshow-music-toggle');
      if (slideshowMusicBtn) {
        slideshowMusicBtn.onclick = () => {
          const isPlaying = this.audio.toggle();
          slideshowMusicBtn.classList.toggle('text-rose-500', isPlaying);
          slideshowMusicBtn.classList.toggle('text-rose-300', !isPlaying);
        };
      }

      // Lightbox Touch Gestures (Swipe left/right to navigate, swipe down to close)
      let touchStartX = 0;
      let touchStartY = 0;
      const lightboxModal = document.getElementById('lightbox-modal');
      if (lightboxModal) {
        lightboxModal.addEventListener('touchstart', (e) => {
          touchStartX = e.changedTouches[0].screenX;
          touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        lightboxModal.addEventListener('touchend', (e) => {
          const diffX = e.changedTouches[0].screenX - touchStartX;
          const diffY = e.changedTouches[0].screenY - touchStartY;
          // Horizontal swipe
          if (Math.abs(diffX) > 45 && Math.abs(diffX) > Math.abs(diffY)) {
            if (diffX < 0) {
              this.navigateLightbox(1);
            } else {
              this.navigateLightbox(-1);
            }
          } else if (diffY > 70 && Math.abs(diffY) > Math.abs(diffX)) {
            this.closeLightbox();
          }
        }, { passive: true });
      }

      // Keyboard Controls for Lightbox & Slideshow
      window.addEventListener('keydown', (e) => {
        if (lightboxModal && !lightboxModal.classList.contains('hidden')) {
          if (e.key === 'ArrowLeft') this.navigateLightbox(-1);
          if (e.key === 'ArrowRight') this.navigateLightbox(1);
          if (e.key === 'Escape') this.closeLightbox();
        }
        const slideshowModal = document.getElementById('slideshow-modal');
        if (slideshowModal && !slideshowModal.classList.contains('hidden')) {
          if (e.key === 'ArrowLeft') this.prevSlide();
          if (e.key === 'ArrowRight') this.nextSlide();
          if (e.key === ' ' || e.code === 'Space') {
            e.preventDefault();
            this.toggleSlideshowPlay();
          }
          if (e.key === 'Escape') this.stopSlideshow();
        }
      });

      // Auto-geocoding on manual location input
      const locInput = document.getElementById('moment-location-input');
      const latInput = document.getElementById('moment-lat-input');
      const lngInput = document.getElementById('moment-lng-input');
      const exifBadge = document.getElementById('exif-detected-badge');
      const exifText = document.getElementById('exif-detected-text');

      if (locInput) {
        locInput.addEventListener('change', async () => {
          const val = locInput.value.trim();
          if (val && !latInput.value) {
            try {
              const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&limit=1&accept-language=ru`, {
                headers: { 'User-Agent': 'LoveStoryApp/1.0 (love-story@pair.local)' }
              });
              const data = await res.json();
              if (data && data.length > 0) {
                latInput.value = data[0].lat;
                lngInput.value = data[0].lon;
                if (exifBadge && exifText) {
                  const shortName = data[0].display_name.split(',').slice(0, 2).join(', ');
                  exifText.innerText = `📍 Координаты определены: ${shortName}`;
                  exifBadge.classList.remove('hidden');
                }
              }
            } catch (e) {}
          }
        });
      }

      const musicBtn = document.getElementById('music-toggle-btn');
      if (musicBtn) {
        musicBtn.onclick = () => {
          const isPlaying = this.audio.toggle();
          const icon = musicBtn.querySelector('i');
          if (isPlaying) {
            musicBtn.classList.add('bg-rose-500', 'text-white', 'animate-pulse');
            musicBtn.classList.remove('bg-white/80', 'text-zinc-700');
            icon.className = 'fa-solid fa-volume-high';
          } else {
            musicBtn.classList.remove('bg-rose-500', 'text-white', 'animate-pulse');
            musicBtn.classList.add('bg-white/80', 'text-zinc-700');
            icon.className = 'fa-solid fa-music';
          }
        };
      }

      const petalsBtn = document.getElementById('petals-toggle-btn');
      if (petalsBtn) {
        petalsBtn.onclick = () => {
          const active = this.petals.toggle();
          petalsBtn.classList.toggle('text-rose-500', active);
        };
      }

      document.getElementById('lightbox-close-btn').onclick = () => this.closeLightbox();
      document.getElementById('lightbox-prev-btn').onclick = () => this.navigateLightbox(-1);
      document.getElementById('lightbox-next-btn').onclick = () => this.navigateLightbox(1);
      document.getElementById('lightbox-modal').onclick = (e) => {
        if (e.target.id === 'lightbox-modal') this.closeLightbox();
      };

      const addMomentModal = document.getElementById('add-moment-modal');
      document.getElementById('open-add-moment-btn').onclick = () => {
        this.resetAddMomentForm();
        addMomentModal.classList.remove('hidden');
        addMomentModal.classList.add('flex');
      };
      document.getElementById('close-add-moment-btn').onclick = () => {
        addMomentModal.classList.add('hidden');
        addMomentModal.classList.remove('flex');
      };

      const fileInput = document.getElementById('moment-file-input');
      const dropZone = document.getElementById('moment-dropzone');
      const previewContainer = document.getElementById('preview-container');

      dropZone.onclick = () => fileInput.click();

      fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) await this.handleSelectedPhoto(file);
      };

      dropZone.ondragover = (e) => {
        e.preventDefault();
        dropZone.classList.add('border-rose-500', 'bg-rose-50/50');
      };
      dropZone.ondragleave = () => {
        dropZone.classList.remove('border-rose-500', 'bg-rose-50/50');
      };
      dropZone.ondrop = async (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-rose-500', 'bg-rose-50/50');
        const file = e.dataTransfer.files[0];
        if (file) await this.handleSelectedPhoto(file);
      };

      document.getElementById('remove-photo-btn').onclick = () => {
        this.uploadedImageBlob = null;
        this.uploadedImageDataUrl = null;
        previewContainer.classList.add('hidden');
        dropZone.classList.remove('hidden');
        fileInput.value = '';
      };

      document.getElementById('add-moment-form').onsubmit = async (e) => {
        e.preventDefault();
        await this.saveNewMoment();
      };

      const settingsModal = document.getElementById('settings-modal');
      document.getElementById('open-settings-btn').onclick = async () => {
        await this.populateSettingsForm();
        settingsModal.classList.remove('hidden');
        settingsModal.classList.add('flex');
      };
      document.getElementById('close-settings-btn').onclick = () => {
        settingsModal.classList.add('hidden');
        settingsModal.classList.remove('flex');
      };
      document.getElementById('settings-form').onsubmit = async (e) => {
        e.preventDefault();
        await this.saveSettings();
      };

      // Logout and reset remember-device
      const logoutLockBtn = document.getElementById('logout-lock-btn');
      if (logoutLockBtn) {
        logoutLockBtn.onclick = () => {
          if (confirm('Заблокировать сайт и выйти? При следующем входе снова потребуется ввести PIN-код.')) {
            localStorage.removeItem('love_app_remember_device');
            sessionStorage.removeItem('app_unlocked');
            window.location.reload();
          }
        };
      }

      document.getElementById('export-backup-btn').onclick = () => this.storage.exportBackup();
      const backupFileInput = document.getElementById('import-backup-input');
      document.getElementById('import-backup-btn').onclick = () => backupFileInput.click();
      backupFileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          const text = await file.text();
          const success = await this.storage.importBackup(text);
          if (success) {
            alert('Данные успешно восстановлены из резервной копии!');
            await this.loadAndRenderAll();
          } else {
            alert('Ошибка при чтении файла бэкапа');
          }
        }
      };

      // Photobook Modal Controls
      const photobookModal = document.getElementById('photobook-modal');
      const openPhotobookBtn = document.getElementById('open-photobook-btn');
      const closePhotobookBtn = document.getElementById('close-photobook-btn');
      const printPhotobookBtn = document.getElementById('print-photobook-btn');
      const photobookContainer = document.getElementById('photobook-preview-container');

      if (openPhotobookBtn) {
        openPhotobookBtn.onclick = () => {
          const spreadsHtml = this.photobook.generateSpreads(this.moments, {
            startDate: INITIAL_CONFIG.startDate,
            quote: INITIAL_CONFIG.quote
          });
          photobookContainer.innerHTML = spreadsHtml;
          photobookModal.classList.remove('hidden');
          photobookModal.classList.add('flex');
        };
      }
      if (closePhotobookBtn) {
        closePhotobookBtn.onclick = () => {
          photobookModal.classList.add('hidden');
          photobookModal.classList.remove('flex');
        };
      }
      if (printPhotobookBtn) {
        printPhotobookBtn.onclick = () => {
          window.print();
        };
      }
      if (photobookModal) {
        photobookModal.onclick = (e) => {
          if (e.target.id === 'photobook-modal') {
            photobookModal.classList.add('hidden');
            photobookModal.classList.remove('flex');
          }
        };
      }

      // Time Capsule form toggle
      const capsuleCheckbox = document.getElementById('moment-is-capsule');
      const capsuleContainer = document.getElementById('capsule-date-container');
      if (capsuleCheckbox && capsuleContainer) {
        capsuleCheckbox.onchange = () => {
          capsuleContainer.classList.toggle('hidden', !capsuleCheckbox.checked);
        };
      }
    }

    async handleSelectedPhoto(file) {
      try {
        const compressed = await compressImage(file, 1600, 0.85);
        this.uploadedImageBlob = compressed.blob;
        this.uploadedImageDataUrl = compressed.dataUrl;

        const dropZone = document.getElementById('moment-dropzone');
        const previewContainer = document.getElementById('preview-container');
        const imgPreview = document.getElementById('moment-img-preview');
        const exifBadge = document.getElementById('exif-detected-badge');
        const exifText = document.getElementById('exif-detected-text');

        imgPreview.src = compressed.dataUrl;
        dropZone.classList.add('hidden');
        previewContainer.classList.remove('hidden');

        // Extract EXIF data (Date & GPS)
        const exifData = await this.exifEngine.extractMetadata(file);
        let detectedCity = null;

        if (exifData && exifData.hasExif) {
          const detectedMessages = [];

          if (exifData.originalDate) {
            document.getElementById('moment-date-input').value = exifData.originalDate;
            detectedMessages.push(`Дата: ${exifData.originalDate}`);
          }

          if (exifData.gps) {
            document.getElementById('moment-lat-input').value = exifData.gps.lat;
            document.getElementById('moment-lng-input').value = exifData.gps.lng;

            const placeName = await this.exifEngine.reverseGeocode(exifData.gps.lat, exifData.gps.lng);
            if (placeName) {
              document.getElementById('moment-location-input').value = placeName;
              detectedCity = placeName.split(',')[0].trim();
              detectedMessages.push(`Локация: ${placeName}`);
            }
          }

          if (detectedMessages.length > 0 && exifBadge && exifText) {
            exifText.innerText = `Определено по снимку: ${detectedMessages.join(' • ')}`;
            exifBadge.classList.remove('hidden');
          }
        }

        // Auto-suggest title if empty
        const titleInp = document.getElementById('moment-title-input');
        if (titleInp && !titleInp.value.trim()) {
          if (detectedCity) {
            titleInp.value = `Прогулка в ${detectedCity}`;
          } else {
            titleInp.value = 'Наш прекрасный день';
          }
        }
      } catch (err) {
        alert('Пожалуйста, выберите файл изображения');
      }
    }

    resetAddMomentForm() {
      document.getElementById('add-moment-form').reset();
      document.getElementById('moment-date-input').value = new Date().toISOString().slice(0, 10);
      const latInp = document.getElementById('moment-lat-input');
      const lngInp = document.getElementById('moment-lng-input');
      const exifBadge = document.getElementById('exif-detected-badge');
      if (latInp) latInp.value = '';
      if (lngInp) lngInp.value = '';
      if (exifBadge) exifBadge.classList.add('hidden');

      const capsuleCheck = document.getElementById('moment-is-capsule');
      const capsuleBox = document.getElementById('capsule-date-container');
      const unlockDateInput = document.getElementById('moment-unlock-date-input');
      if (capsuleCheck) capsuleCheck.checked = false;
      if (capsuleBox) capsuleBox.classList.add('hidden');
      if (unlockDateInput) {
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        unlockDateInput.value = nextYear.toISOString().slice(0, 10);
      }

      this.uploadedImageBlob = null;
      this.uploadedImageDataUrl = null;
      document.getElementById('preview-container').classList.add('hidden');
      document.getElementById('moment-dropzone').classList.remove('hidden');
    }

    async saveNewMoment() {
      const title = document.getElementById('moment-title-input').value.trim();
      const date = document.getElementById('moment-date-input').value;
      const category = document.getElementById('moment-category-input').value;
      const location = document.getElementById('moment-location-input').value.trim();
      const description = document.getElementById('moment-desc-input').value.trim();
      const latVal = document.getElementById('moment-lat-input')?.value;
      const lngVal = document.getElementById('moment-lng-input')?.value;
      const isCapsule = document.getElementById('moment-is-capsule')?.checked || false;
      const unlockDate = document.getElementById('moment-unlock-date-input')?.value || null;

      if (!this.uploadedImageDataUrl) {
        alert('Пожалуйста, прикрепите фотографию момента!');
        return;
      }

      const saveBtn = document.getElementById('submit-moment-btn');
      saveBtn.disabled = true;
      saveBtn.innerText = 'Сохраняем...';

      const newMoment = {
        id: `moment-${Date.now()}`,
        title: title || 'Наш прекрасный день',
        date: date || new Date().toISOString().slice(0, 10),
        category: category || 'Уютные дни',
        location: location || '',
        lat: latVal ? parseFloat(latVal) : null,
        lng: lngVal ? parseFloat(lngVal) : null,
        description: description || '',
        imageUrl: this.uploadedImageDataUrl,
        likes: 1,
        isLiked: true,
        isCapsule: isCapsule,
        unlockDate: isCapsule ? unlockDate : null,
        createdAt: new Date().toISOString()
      };

      await this.storage.saveMoment(newMoment, this.uploadedImageBlob);
      this.moments = await this.storage.getMoments();
      this.updateHeroStats();
      this.renderCurrentView();

      saveBtn.disabled = false;
      saveBtn.innerText = 'Сохранить момент';
      document.getElementById('add-moment-modal').classList.add('hidden');
      document.getElementById('add-moment-modal').classList.remove('flex');
    }

    setupLocationModal() {
      const modal = document.getElementById('edit-location-modal');
      const closeBtn = document.getElementById('close-edit-location-btn');
      const form = document.getElementById('edit-location-form');
      const input = document.getElementById('edit-location-input');
      const latInp = document.getElementById('edit-location-lat');
      const lngInp = document.getElementById('edit-location-lng');
      const statusEl = document.getElementById('edit-location-status');
      if (!modal) return;

      if (closeBtn) {
        closeBtn.onclick = () => {
          modal.classList.add('hidden');
          modal.classList.remove('flex');
        };
      }

      modal.onclick = (e) => {
        if (e.target.id === 'edit-location-modal') {
          modal.classList.add('hidden');
          modal.classList.remove('flex');
        }
      };

      // Quick 1-click popular city pills
      document.querySelectorAll('.quick-loc-pill').forEach(btn => {
        btn.onclick = () => {
          const city = btn.getAttribute('data-city');
          const lat = btn.getAttribute('data-lat');
          const lng = btn.getAttribute('data-lng');
          if (input) input.value = city;
          if (latInp) latInp.value = lat;
          if (lngInp) lngInp.value = lng;
          if (statusEl) {
            statusEl.innerHTML = `<span class="text-rose-600 font-medium">📍 Выбран город: ${escapeHtml(city)}</span>`;
          }
        };
      });

      // Typing in input: search Nominatim OSM with debounce
      if (input) {
        input.oninput = () => {
          const query = input.value.trim();
          clearTimeout(this.locationSearchTimeout);
          if (query.length < 3) {
            if (statusEl) statusEl.innerHTML = '';
            return;
          }
          if (statusEl) statusEl.innerHTML = '<span class="text-zinc-400">Поиск координат...</span>';
          this.locationSearchTimeout = setTimeout(async () => {
            try {
              const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
              const res = await fetch(url, { headers: { 'Accept-Language': 'ru' } });
              if (res.ok) {
                const data = await res.json();
                if (data && data.length > 0) {
                  const place = data[0];
                  if (latInp) latInp.value = place.lat;
                  if (lngInp) lngInp.value = place.lon;
                  if (statusEl) {
                    const shortName = place.display_name.split(',').slice(0, 3).join(',');
                    statusEl.innerHTML = `<span class="text-emerald-600 font-medium">📍 Найдено: ${escapeHtml(shortName)}</span>`;
                  }
                } else if (statusEl) {
                  statusEl.innerHTML = '<span class="text-amber-600">Координаты не найдены, но название сохранится</span>';
                }
              }
            } catch (err) {
              if (statusEl) statusEl.innerHTML = '';
            }
          }, 500);
        };
      }

      if (form) {
        form.onsubmit = async (e) => {
          e.preventDefault();
          const momentId = document.getElementById('edit-location-moment-id').value;
          const locText = input ? input.value.trim() : '';
          const latVal = latInp && latInp.value ? parseFloat(latInp.value) : null;
          const lngVal = lngInp && lngInp.value ? parseFloat(lngInp.value) : null;

          if (!momentId) return;

          const submitBtn = document.getElementById('save-location-btn');
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Сохраняем...';
          }

          const updated = await this.storage.updateMomentLocation(momentId, locText, latVal, lngVal);
          if (updated) {
            const idx = this.moments.findIndex(m => m.id === momentId);
            if (idx !== -1) {
              this.moments[idx] = updated;
            }
          }

          modal.classList.add('hidden');
          modal.classList.remove('flex');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Сохранить в Атлас';
          }

          this.updateHeroStats();
          this.renderCurrentView();
        };
      }
    }

    openEditLocationModal(moment) {
      const modal = document.getElementById('edit-location-modal');
      const idInp = document.getElementById('edit-location-moment-id');
      const input = document.getElementById('edit-location-input');
      const latInp = document.getElementById('edit-location-lat');
      const lngInp = document.getElementById('edit-location-lng');
      const statusEl = document.getElementById('edit-location-status');
      if (!modal) return;

      if (idInp) idInp.value = moment.id;
      if (input) input.value = moment.location || '';
      if (latInp) latInp.value = moment.lat !== undefined && moment.lat !== null ? moment.lat : '';
      if (lngInp) lngInp.value = moment.lng !== undefined && moment.lng !== null ? moment.lng : '';
      if (statusEl) {
        if (moment.lat && moment.lng) {
          statusEl.innerHTML = `<span class="text-rose-600 font-medium">📍 Точка на карте: ${moment.lat.toFixed(4)}, ${moment.lng.toFixed(4)}</span>`;
        } else {
          statusEl.innerHTML = '';
        }
      }

      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }

    async populateSettingsForm() {
      const pin = await this.storage.getSetting('pin') || INITIAL_CONFIG.defaultPin;
      const startDate = await this.storage.getSetting('start_date') || INITIAL_CONFIG.startDate;
      const supabaseUrl = await this.storage.getSetting('supabase_url') || INITIAL_CONFIG.defaultSupabaseUrl || '';
      const supabaseKey = await this.storage.getSetting('supabase_key') || INITIAL_CONFIG.defaultSupabaseKey || '';

      document.getElementById('settings-pin-input').value = pin;
      document.getElementById('settings-date-input').value = startDate.slice(0, 10);
      document.getElementById('settings-supabase-url').value = supabaseUrl;
      document.getElementById('settings-supabase-key').value = supabaseKey;
    }

    async saveSettings() {
      const pin = document.getElementById('settings-pin-input').value.trim();
      const startDate = document.getElementById('settings-date-input').value;
      const supabaseUrl = document.getElementById('settings-supabase-url').value.trim();
      const supabaseKey = document.getElementById('settings-supabase-key').value.trim();

      if (pin.length !== 4) {
        alert('PIN-код должен состоять ровно из 4 цифр!');
        return;
      }

      await this.storage.saveSetting('pin', pin);
      this.correctPin = pin;

      if (startDate) {
        await this.storage.saveSetting('start_date', `${startDate}T00:00:00`);
        this.counter.setStartDate(`${startDate}T00:00:00`);
      }

      await this.storage.saveSetting('supabase_url', supabaseUrl);
      await this.storage.saveSetting('supabase_key', supabaseKey);

      await this.storage.initSupabaseIfConfigured();
      this.updateCloudStatusIndicator();

      alert('Настройки успешно сохранены!');
      document.getElementById('settings-modal').classList.add('hidden');
      document.getElementById('settings-modal').classList.remove('flex');
    }

    updateCloudStatusIndicator() {
      const el = document.getElementById('cloud-sync-status');
      if (!el) return;
      if (this.storage.isCloudConfigured()) {
        el.innerHTML = `<span class="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full"><i class="fa-solid fa-cloud"></i> Облако подключено</span>`;
      } else {
        el.innerHTML = `<span class="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full" title="Фото хранятся локально в браузере. В настройках можно подключить Supabase для облачной синхронизации с телефоном"><i class="fa-solid fa-hard-drive"></i> Локально (Offline)</span>`;
      }
    }
  }

  // Auto-start on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const app = new LoveStoryApp();
      app.init();
    });
  } else {
    const app = new LoveStoryApp();
    app.init();
  }

})();
