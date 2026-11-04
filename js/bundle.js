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
          if (!error && data && data.length > 0) return data;
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
      const moments = await this.getAllFromStore(STORE_MOMENTS);
      const moment = moments.find((m) => m.id === id);
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

    async deleteMoment(id, moment = null) {
      await this.deleteFromStore(STORE_MOMENTS, id);
      if (this.supabaseClient) {
        try {
          await this.supabaseClient.from('moments').delete().eq('id', id);
          if (moment && moment.imageUrl && moment.imageUrl.includes('/storage/v1/object/public/photos/')) {
            const fileName = moment.imageUrl.split('/storage/v1/object/public/photos/').pop();
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
          <audio controls class="w-full max-w-md accent-rose-600 rounded-xl mt-2" src="${moment.imageUrl}"></audio>
        </div>
      `;
    } else {
      mediaContent = `
        <div class="relative overflow-hidden aspect-[16/10] sm:aspect-[16/9] bg-rose-50 cursor-pointer moment-image-trigger" data-id="${moment.id}">
          <img src="${moment.imageUrl}" alt="${escapeHtml(moment.title)}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
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
        <div class="masonry-item relative group rounded-2xl overflow-hidden shadow-sm glass-card border border-rose-200 bg-gradient-to-tr from-rose-950 to-pink-900 p-6 flex flex-col items-center justify-center text-center text-white min-h-[200px]" data-id="${moment.id}">
          <div class="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-2 animate-pulse">
            <i class="fa-solid fa-lock text-rose-300"></i>
          </div>
          <span class="text-[10px] tracking-widest uppercase text-rose-200 font-semibold mb-1">Капсула времени</span>
          <h4 class="font-serif-romantic text-base font-bold">${escapeHtml(moment.title)}</h4>
          <p class="text-xs text-rose-200/80 mt-1">Откроется ${formatDateRu(moment.unlockDate)}</p>
        </div>
      `;
    }

    return `
      <div class="masonry-item relative group rounded-2xl overflow-hidden shadow-sm glass-card border border-rose-100 cursor-pointer moment-image-trigger" data-id="${moment.id}">
        <img src="${moment.imageUrl}" alt="${escapeHtml(moment.title)}" loading="lazy" class="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500" />
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 text-white">
          <div class="flex justify-between items-center">
            <span class="px-2.5 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-md">
              ${escapeHtml(moment.category || 'Фото')}
            </span>
            <button class="like-btn p-2 rounded-full backdrop-blur-md bg-white/20 hover:bg-white/40 text-rose-400" data-id="${moment.id}" onclick="event.stopPropagation()">
              <i class="${isLiked ? 'fa-solid text-rose-400' : 'fa-regular text-white'} fa-heart"></i>
            </button>
          </div>
          <div>
            <h4 class="font-serif-romantic text-lg sm:text-xl font-bold leading-tight drop-shadow-sm">
              ${escapeHtml(moment.title)}
            </h4>
            <p class="text-xs text-rose-100/90 mt-1 flex items-center gap-1.5">
              <i class="fa-regular fa-calendar text-[10px]"></i>
              ${formatDateRu(moment.date)}
            </p>
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

  // --- 9. INTERACTIVE MEMORY MAP ENGINE (LEAFLET) ---
  class MemoryMapEngine {
    constructor(containerId, onMomentClick) {
      this.containerId = containerId;
      this.map = null;
      this.markersGroup = null;
      this.routeLayer = null;
      this.onMomentClick = onMomentClick;
      this.isInitialized = false;
      this.showRoute = false;
      this.activeCategory = 'all';
      this.allMoments = [];
    }

    init() {
      if (this.isInitialized || !document.getElementById(this.containerId)) return;
      if (typeof L === 'undefined') return;

      this.map = L.map(this.containerId, {
        zoomControl: true,
        scrollWheelZoom: true
      }).setView([55.7558, 37.6173], 6);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(this.map);

      this.markersGroup = L.layerGroup().addTo(this.map);
      this.isInitialized = true;
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

    createHeartIcon() {
      return L.divIcon({
        className: 'custom-map-heart-marker',
        html: `
          <div class="relative cursor-pointer -translate-x-1/2 -translate-y-full group">
            <div class="w-10 h-10 rounded-full bg-white border-2 border-rose-500 shadow-lg flex items-center justify-center text-rose-500 hover:scale-110 hover:bg-rose-500 hover:text-white transition-all duration-300">
              <i class="fa-solid fa-heart text-base animate-pulse"></i>
            </div>
            <div class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-rose-500 mx-auto -mt-[1px]"></div>
          </div>
        `,
        iconSize: [40, 48],
        iconAnchor: [20, 48],
        popupAnchor: [0, -46]
      });
    }

    setCategory(category) {
      this.activeCategory = category;
      this.renderMoments(this.allMoments);
    }

    toggleRoute() {
      this.showRoute = !this.showRoute;
      this.renderMoments(this.allMoments);
      return this.showRoute;
    }

    fitAll() {
      if (!this.map) return;
      const withCoords = this.getFiltered(this.allMoments);
      const bounds = withCoords.map(m => [m.lat, m.lng]);
      if (bounds.length > 0) {
        this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
    }

    getFiltered(moments) {
      let withCoords = (moments || []).filter(m => m.lat && m.lng);
      if (this.activeCategory && this.activeCategory !== 'all') {
        withCoords = withCoords.filter(m => m.category === this.activeCategory);
      }
      return withCoords;
    }

    renderMoments(moments) {
      this.allMoments = moments || [];
      if (!this.map) this.init();
      if (!this.map || !this.markersGroup) return;

      this.markersGroup.clearLayers();
      if (this.routeLayer) {
        this.map.removeLayer(this.routeLayer);
        this.routeLayer = null;
      }

      const filtered = this.getFiltered(this.allMoments);

      // Calculate total distance & stats across all coordinated moments
      const sortedChronological = [...this.allMoments.filter(m => m.lat && m.lng)].sort((a, b) => new Date(a.date) - new Date(b.date));
      let totalDistance = 0;
      for (let i = 0; i < sortedChronological.length - 1; i++) {
        totalDistance += this.calculateDistanceKm(
          sortedChronological[i].lat, sortedChronological[i].lng,
          sortedChronological[i + 1].lat, sortedChronological[i + 1].lng
        );
      }

      const distEl = document.getElementById('map-stats-distance');
      if (distEl) {
        distEl.innerText = totalDistance > 0 ? `${Math.round(totalDistance).toLocaleString('ru-RU')} км` : '0 км';
      }

      // Draw Route Polyline if active
      if (this.showRoute && sortedChronological.length > 1) {
        const routeCoords = sortedChronological.map(m => [m.lat, m.lng]);
        this.routeLayer = L.polyline(routeCoords, {
          color: '#f43f5e',
          weight: 4,
          opacity: 0.9,
          className: 'romantic-route-line',
          dashArray: '8, 8'
        }).addTo(this.map);
      }

      if (filtered.length === 0) return;

      const bounds = [];
      filtered.forEach(moment => {
        const latLng = [moment.lat, moment.lng];
        bounds.push(latLng);
        const marker = L.marker(latLng, { icon: this.createHeartIcon() });
        const popupHtml = `
          <div class="p-2 max-w-[220px] font-sans">
            <div class="rounded-xl overflow-hidden aspect-[16/10] bg-rose-50 mb-2 relative">
              <img src="${moment.imageUrl}" alt="${moment.title}" class="w-full h-full object-cover" />
              <span class="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/90 text-rose-600 backdrop-blur-sm">
                ${moment.category || 'Момент'}
              </span>
            </div>
            <h4 class="font-bold text-zinc-800 text-sm leading-tight mb-1 font-serif-romantic">${moment.title}</h4>
            <p class="text-[11px] text-zinc-500 mb-2">${moment.date} ${moment.location ? '• ' + moment.location : ''}</p>
            <button class="map-popup-view-btn w-full py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-sm transition-colors" data-id="${moment.id}">
              Открыть воспоминание
            </button>
          </div>
        `;
        marker.bindPopup(popupHtml, { className: 'custom-map-popup', closeButton: false, maxWidth: 240 });
        marker.on('popupopen', () => {
          const btn = document.querySelector(`.map-popup-view-btn[data-id="${moment.id}"]`);
          if (btn) btn.onclick = () => { if (this.onMomentClick) this.onMomentClick(moment); };
        });
        this.markersGroup.addLayer(marker);
      });

      if (bounds.length > 0) {
        this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
    }

    invalidateSize() {
      if (this.map) setTimeout(() => this.map.invalidateSize(), 200);
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
                  <img src="${m1.imageUrl}" alt="${escapeHtml(m1.title)}" class="w-full h-full object-cover" />
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
                    <img src="${m2.imageUrl}" alt="${escapeHtml(m2.title)}" class="w-full h-full object-cover" />
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

  // --- 11. DATE IDEAS & BUCKET LIST ENGINE ---
  const DATE_IDEAS = [
    {
      id: 'date-1',
      category: 'cozy',
      title: 'Форт из пледов и подушек',
      vibe: '✨ Уютно и тепло',
      badge: 'Дома',
      icon: 'fa-campground',
      recommendedCategory: 'Уютные дни',
      description: 'Построить посреди комнаты настоящий детский форт из всех пледов и стульев, зажечь гирлянды, взять попкорн и смотреть любимый фильм.'
    },
    {
      id: 'date-2',
      category: 'cozy',
      title: 'Кулинарный баттл: домашняя паста',
      vibe: '🍝 Вкусно и весело',
      badge: 'Дома',
      icon: 'fa-utensils',
      recommendedCategory: 'Уютные дни',
      description: 'Включить итальянский джаз, открыть бутылку вина или сидра и с нуля приготовить домашнюю пасту или пиццу с любимыми топпингами.'
    },
    {
      id: 'date-3',
      category: 'cozy',
      title: 'Вечер при свечах без гаджетов',
      vibe: '🕯️ Душевный разговор',
      badge: 'Дома',
      icon: 'fa-fire-flame-curved',
      recommendedCategory: 'Свидания',
      description: 'Отложить все смартфоны на вечер в коробку, зажечь свечи и задать друг другу 36 вопросов, чтобы влюбиться заново.'
    },
    {
      id: 'date-4',
      category: 'cozy',
      title: 'Домашний SPA-салон для двоих',
      vibe: '🫧 Расслабление',
      badge: 'Дома',
      icon: 'fa-spa',
      recommendedCategory: 'Уютные дни',
      description: 'Тёплая ванна с пеной и морской солью, массаж с ароматическими маслами и расслабляющий плейлист.'
    },
    {
      id: 'date-5',
      category: 'cozy',
      title: 'Вечер настольных игр и какао',
      vibe: '🎲 Азарт и смех',
      badge: 'Дома',
      icon: 'fa-dice',
      recommendedCategory: 'Смешные моменты',
      description: 'Сварить горячее какао с маршмеллоу и устроить турнир в любимые настолки, карты или видеоигры на приставке.'
    },
    {
      id: 'date-6',
      category: 'cozy',
      title: 'Рисование портретов друг друга вслепую',
      vibe: '🎨 Смех до слёз',
      badge: 'Дома',
      icon: 'fa-palette',
      recommendedCategory: 'Смешные моменты',
      description: 'Взять краски или маркеры и за 5 минут нарисовать портрет партнёра, не отрывая руки от бумаги. Результат оформить в рамочку!'
    },
    {
      id: 'date-7',
      category: 'city',
      title: 'Спонтанная фотосессия на плёнку',
      vibe: '📸 Плёночная эстетика',
      badge: 'В городе',
      icon: 'fa-camera-retro',
      recommendedCategory: 'Свидания',
      description: 'Купить одноразовый плёночный фотоаппарат и пойти гулять по городу, снимая искренние улыбки и забавные моменты.'
    },
    {
      id: 'date-8',
      category: 'city',
      title: 'Тайный кофе-спот и десерты',
      vibe: '☕ Сладкоежки',
      badge: 'В городе',
      icon: 'fa-mug-hot',
      recommendedCategory: 'Свидания',
      description: 'Найти в городе кофейню, где вы ещё никогда не были, заказать самый необычный десерт и делиться впечатлениями.'
    },
    {
      id: 'date-9',
      category: 'city',
      title: 'Свидание в книжном магазине',
      vibe: '📖 Романтика страниц',
      badge: 'В городе',
      icon: 'fa-book-bookmark',
      recommendedCategory: 'Свидания',
      description: 'Пойти в большой книжный, разделиться на 15 минут и выбрать друг для друга по одной книге, которая напоминает о партнере.'
    },
    {
      id: 'date-10',
      category: 'city',
      title: 'Ночная прогулка по безлюдному городу',
      vibe: '🌙 Магия ночи',
      badge: 'В городе',
      icon: 'fa-moon',
      recommendedCategory: 'Свидания',
      description: 'Выйти гулять после полуночи, когда город засыпает, держаться за руки под фонарями и слушать эхо своих шагов.'
    },
    {
      id: 'date-11',
      category: 'city',
      title: 'Тайные подарки на 500 рублей',
      vibe: '🎁 Сюрприз',
      badge: 'В городе',
      icon: 'fa-gift',
      recommendedCategory: 'Смешные моменты',
      description: 'Зайти в винтажную лавку или маркет с бюджетом ровно 500 рублей, купить друг другу тайный подарок и распаковать в парке.'
    },
    {
      id: 'date-12',
      category: 'city',
      title: 'Вечер в планетарии или на крыше',
      vibe: '✨ Звёзды и огни',
      badge: 'В городе',
      icon: 'fa-star',
      recommendedCategory: 'Свидания',
      description: 'Посмотреть на звёзды или подняться на смотровую площадку города, чтобы увидеть море вечерних огней.'
    },
    {
      id: 'date-13',
      category: 'adventure',
      title: 'Спонтанная поездка на электричке',
      vibe: '🚂 Дорожная романтика',
      badge: 'Приключение',
      icon: 'fa-train',
      recommendedCategory: 'Путешествия',
      description: 'Приехать на вокзал, сесть на первую попавшуюся электричку в милый городок, гулять там целый день и пить чай из термоса.'
    },
    {
      id: 'date-14',
      category: 'adventure',
      title: 'Пикник на закате с пледом и фруктами',
      vibe: '🌅 Золотой час',
      badge: 'Приключение',
      icon: 'fa-sun',
      recommendedCategory: 'Путешествия',
      description: 'Взять с собой любимые фрукты, сыр, плед и встретить закат на берегу реки, озера или живописной поляны.'
    },
    {
      id: 'date-15',
      category: 'adventure',
      title: 'Мастер-класс по гончарному делу',
      vibe: '🏺 Для двоих',
      badge: 'Приключение',
      icon: 'fa-hands',
      recommendedCategory: 'Свидания',
      description: 'Вместе испачкать руки в глине за гончарным кругом и слепить кружки или тарелочки для ваших совместных завтраков.'
    },
    {
      id: 'date-16',
      category: 'adventure',
      title: 'Ночной пикник на капоте машины',
      vibe: '🚗 Музыка и звёзды',
      badge: 'Приключение',
      icon: 'fa-car',
      recommendedCategory: 'Свидания',
      description: 'Выехать за город подальше от огней, включить любимую музыку через колонки и смотреть на ночное небо.'
    },
    {
      id: 'date-17',
      category: 'adventure',
      title: 'Встретить рассвет вдвоём',
      vibe: '☕ Начало нового дня',
      badge: 'Приключение',
      icon: 'fa-mountain-sun',
      recommendedCategory: 'Памятные даты',
      description: 'Проснуться в 4 утра, налить горячий кофе в термос и первыми встретить первые лучи солнца над спящим городом.'
    },
    {
      id: 'date-18',
      category: 'soul',
      title: 'Письмо в будущее на 5 лет вперёд',
      vibe: '✉️ Капсула любви',
      badge: 'Для души',
      icon: 'fa-envelope-open-text',
      recommendedCategory: 'Памятные даты',
      description: 'Написать друг другу искренние письма о том, какими вы видите себя через 5 лет, запечатать в конверт и спрятать.'
    },
    {
      id: 'date-19',
      category: 'soul',
      title: 'Плейлист наших воспоминаний',
      vibe: '🎧 Музыка сердец',
      badge: 'Для души',
      icon: 'fa-headphones',
      recommendedCategory: 'Уютные дни',
      description: 'Собрать общий плейлист из треков, под которые вы познакомились, впервые поцеловались или гуляли прошлым летом.'
    },
    {
      id: 'date-20',
      category: 'soul',
      title: 'Вечер благодарности и воспоминаний',
      vibe: '💖 Тёплые слова',
      badge: 'Для души',
      icon: 'fa-heart',
      recommendedCategory: 'Памятные даты',
      description: 'По очереди сказать друг другу по 5 вещей, за которые вы больше всего благодарны в ваших отношениях.'
    }
  ];

  class DateIdeasEngine {
    constructor(storage, onIdeaSelect) {
      this.storage = storage;
      this.onIdeaSelect = onIdeaSelect;
      this.completedIds = new Set();
      this.currentCategory = 'all';
    }

    async init() {
      const saved = await this.storage.getSetting('completed_date_ids');
      if (saved && Array.isArray(saved)) {
        this.completedIds = new Set(saved);
      }
      this.render();
    }

    async toggle(id) {
      if (this.completedIds.has(id)) {
        this.completedIds.delete(id);
      } else {
        this.completedIds.add(id);
      }
      await this.storage.saveSetting('completed_date_ids', Array.from(this.completedIds));
      this.render();
    }

    render(category = this.currentCategory) {
      this.currentCategory = category;
      const container = document.getElementById('date-ideas-list');
      if (!container) return;

      const filtered = category === 'all' 
        ? DATE_IDEAS 
        : DATE_IDEAS.filter(d => d.category === category);

      container.innerHTML = filtered.map(d => {
        const isDone = this.completedIds.has(d.id);
        return `
          <div class="date-idea-card p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 ${
            isDone 
              ? 'bg-emerald-50/50 border-emerald-200 opacity-80' 
              : 'bg-white border-rose-100 hover:border-rose-300 shadow-sm'
          }">
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-start gap-3 flex-1">
                <button class="toggle-date-done-btn w-6 h-6 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  isDone 
                    ? 'border-emerald-500 bg-emerald-500 text-white' 
                    : 'border-zinc-300 hover:border-rose-400 bg-white'
                }" data-id="${d.id}" title="${isDone ? 'Отметить как несделанное' : 'Отметить как выполненное'}">
                  ${isDone ? '<i class="fa-solid fa-check text-xs"></i>' : ''}
                </button>
                <div class="flex-1">
                  <div class="flex items-center gap-2 flex-wrap mb-1">
                    <span class="text-xs px-2 py-0.5 rounded-md font-medium ${
                      isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-50 text-rose-600'
                    }">${escapeHtml(d.vibe)}</span>
                    <span class="text-[10px] text-zinc-400 font-medium">${escapeHtml(d.badge)}</span>
                  </div>
                  <h4 class="text-sm sm:text-base font-bold text-zinc-800 leading-tight ${isDone ? 'line-through text-zinc-500' : ''}">
                    ${escapeHtml(d.title)}
                  </h4>
                  <p class="text-xs text-zinc-600 mt-1 leading-relaxed font-light">
                    ${escapeHtml(d.description)}
                  </p>
                </div>
              </div>
              <button 
                class="start-moment-from-idea-btn px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold shrink-0 flex items-center gap-1 transition-colors"
                data-id="${d.id}"
                title="Добавить фото с этого свидания в ленту"
              >
                <i class="fa-solid fa-camera text-[10px]"></i>
                <span class="hidden sm:inline">Сделать фото</span>
              </button>
            </div>
          </div>
        `;
      }).join('');

      container.querySelectorAll('.toggle-date-done-btn').forEach(btn => {
        btn.onclick = () => {
          const id = btn.getAttribute('data-id');
          this.toggle(id);
        };
      });

      container.querySelectorAll('.start-moment-from-idea-btn').forEach(btn => {
        btn.onclick = () => {
          const id = btn.getAttribute('data-id');
          const idea = DATE_IDEAS.find(i => i.id === id);
          if (idea && this.onIdeaSelect) {
            this.onIdeaSelect(idea);
          }
        };
      });
    }

    rollRandom() {
      const candidates = DATE_IDEAS.filter(d => !this.completedIds.has(d.id));
      const pool = candidates.length > 0 ? candidates : DATE_IDEAS;
      const display = document.getElementById('random-idea-display');
      const btn = document.getElementById('roll-random-date-btn');
      if (!display) return;

      btn.disabled = true;
      let count = 0;
      const interval = setInterval(() => {
        const rand = pool[Math.floor(Math.random() * pool.length)];
        display.innerText = `${rand.vibe}: ${rand.title}! 💖`;
        count++;
        if (count > 10) {
          clearInterval(interval);
          btn.disabled = false;
          const chosen = pool[Math.floor(Math.random() * pool.length)];
          display.innerHTML = `✨ <b>${escapeHtml(chosen.title)}</b><br><span class="text-xs font-normal text-zinc-600">${escapeHtml(chosen.description)}</span>`;
        }
      }, 70);
    }
  }

  // --- 12. MAIN APP CONTROLLER ---
  class LoveStoryApp {
    constructor() {
      this.moments = [];
      this.currentView = 'timeline';
      this.currentFilter = 'Все';
      this.currentPinInput = '';
      this.correctPin = INITIAL_CONFIG.defaultPin;
      this.isUnlocked = false;
      this.counter = null;
      this.petals = null;
      this.audio = new AmbientAudio();
      this.storage = new StorageManager();
      this.exifEngine = new ExifGeoEngine();
      this.mapEngine = new MemoryMapEngine('memory-map', (m) => this.openLightbox(m));
      this.photobook = new PhotobookGenerator();
      this.dateIdeas = new DateIdeasEngine(this.storage, (idea) => this.startMomentFromIdea(idea));
      this.activeLightboxMoment = null;
      this.uploadedImageBlob = null;
      this.uploadedImageDataUrl = null;
    }

    async init() {
      await this.storage.init();
      await this.dateIdeas.init();
      const savedPin = await this.storage.getSetting('pin');
      this.correctPin = savedPin || INITIAL_CONFIG.defaultPin;

      const savedStartDate = await this.storage.getSetting('start_date') || INITIAL_CONFIG.startDate;
      this.counter = new LoveCounter(savedStartDate);

      this.petals = new PetalEffect('petals-canvas');

      const sessionUnlocked = sessionStorage.getItem('app_unlocked');
      if (sessionUnlocked === 'true') {
        this.unlockApp(false);
      } else {
        this.setupLockScreen();
      }

      this.setupGlobalEvents();
      this.setupCounterTimer();
    }

    setupLockScreen() {
      const lockScreen = document.getElementById('lock-screen');
      lockScreen.classList.remove('hidden');

      const keypadBtns = document.querySelectorAll('.keypad-btn');
      keypadBtns.forEach(btn => {
        btn.onclick = () => {
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
      if (this.currentPinInput === this.correctPin) {
        sessionStorage.setItem('app_unlocked', 'true');
        this.unlockApp(true);
      } else {
        const container = document.getElementById('pin-display');
        container.classList.add('animate-shake');
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

    startMomentFromIdea(idea) {
      const datesModal = document.getElementById('dates-modal');
      if (datesModal) {
        datesModal.classList.add('hidden');
        datesModal.classList.remove('flex');
      }
      this.resetAddMomentForm();
      const titleInput = document.getElementById('moment-title-input');
      const descInput = document.getElementById('moment-desc-input');
      const catInput = document.getElementById('moment-category-input');
      if (titleInput) titleInput.value = idea.title;
      if (descInput) descInput.value = `${idea.vibe}\n${idea.description}`;
      if (catInput && idea.recommendedCategory) {
        catInput.value = idea.recommendedCategory;
      }
      const addMomentModal = document.getElementById('add-moment-modal');
      if (addMomentModal) {
        addMomentModal.classList.remove('hidden');
        addMomentModal.classList.add('flex');
      }
    }

    async loadAndRenderAll() {
      this.moments = await this.storage.getMoments();
      this.renderCategoryPills();
      this.renderCurrentView();
      this.updateCloudStatusIndicator();
    }

    renderCategoryPills() {
      const container = document.getElementById('category-pills');
      if (!container) return;
      container.innerHTML = CATEGORIES.map(cat => `
        <button class="category-pill whitespace-nowrap px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
          this.currentFilter === cat 
            ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25' 
            : 'bg-white/80 text-zinc-600 hover:bg-rose-50 border border-rose-100'
        }" data-cat="${cat}">
          ${cat}
        </button>
      `).join('');

      container.querySelectorAll('.category-pill').forEach(btn => {
        btn.onclick = () => {
          this.currentFilter = btn.getAttribute('data-cat');
          this.renderCategoryPills();
          this.renderCurrentView();
        };
      });
    }

    getFilteredMoments() {
      if (this.currentFilter === 'Все') return this.moments;
      return this.moments.filter(m => m.category === this.currentFilter);
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
      this.mapEngine.renderMoments(filtered);
      this.mapEngine.invalidateSize();

      // Calculate Map Statistics
      const withCoords = filtered.filter(m => m.lat && m.lng);
      const cities = new Set(
        withCoords
          .map(m => m.location ? m.location.split('•').pop().split(',')[0].trim() : '')
          .filter(Boolean)
      );

      const elPlaces = document.getElementById('map-stats-places');
      const elCities = document.getElementById('map-stats-cities');
      const elPhotos = document.getElementById('map-stats-photos');
      if (elPlaces) elPlaces.innerText = withCoords.length;
      if (elCities) elCities.innerText = cities.size || (withCoords.length > 0 ? 1 : 0);
      if (elPhotos) elPhotos.innerText = withCoords.length;
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
    }

    setupCounterTimer() {
      const update = () => {
        if (!this.counter) return;
        const stats = this.counter.getExactDifference();

        const elTotalDays = document.getElementById('counter-total-days');
        if (elTotalDays) elTotalDays.innerText = stats.totalDays.toLocaleString('ru-RU');

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

    setupGlobalEvents() {
      document.querySelectorAll('.view-tab-btn').forEach(btn => {
        btn.onclick = () => {
          const view = btn.getAttribute('data-view');
          this.currentView = view;
          document.querySelectorAll('.view-tab-btn').forEach(b => {
            b.classList.remove('active', 'bg-rose-500', 'text-white', 'shadow-md');
            b.classList.add('text-zinc-600', 'hover:text-rose-600');
          });
          btn.classList.add('active', 'bg-rose-500', 'text-white', 'shadow-md');
          btn.classList.remove('text-zinc-600', 'hover:text-rose-600');
          this.renderCurrentView();
        };
      });

      // Map controls: Route toggle, Recenter, Category filters
      const routeToggleBtn = document.getElementById('map-toggle-route-btn');
      if (routeToggleBtn) {
        routeToggleBtn.onclick = () => {
          const isActive = this.mapEngine.toggleRoute();
          if (isActive) {
            routeToggleBtn.classList.add('active');
          } else {
            routeToggleBtn.classList.remove('active');
          }
        };
      }

      const mapRecenterBtn = document.getElementById('map-recenter-btn');
      if (mapRecenterBtn) {
        mapRecenterBtn.onclick = () => {
          this.mapEngine.fitAll();
        };
      }

      document.querySelectorAll('.map-cat-btn').forEach(btn => {
        btn.onclick = () => {
          document.querySelectorAll('.map-cat-btn').forEach(b => {
            b.classList.remove('active', 'bg-rose-500', 'text-white', 'shadow-sm');
            b.classList.add('bg-white/80', 'text-zinc-600', 'border', 'border-rose-100');
          });
          btn.classList.add('active', 'bg-rose-500', 'text-white', 'shadow-sm');
          btn.classList.remove('bg-white/80', 'text-zinc-600', 'border', 'border-rose-100');
          const cat = btn.getAttribute('data-category');
          this.mapEngine.setCategory(cat);
        };
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

      // Date Ideas & Bucket List Modal Controls
      const datesModal = document.getElementById('dates-modal');
      const openDatesBtn = document.getElementById('open-dates-modal-btn');
      const closeDatesBtn = document.getElementById('close-dates-btn');
      const rollRandomBtn = document.getElementById('roll-random-date-btn');

      if (openDatesBtn && datesModal) {
        openDatesBtn.onclick = () => {
          datesModal.classList.remove('hidden');
          datesModal.classList.add('flex');
          this.dateIdeas.render();
        };
      }
      if (closeDatesBtn && datesModal) {
        closeDatesBtn.onclick = () => {
          datesModal.classList.add('hidden');
          datesModal.classList.remove('flex');
        };
      }
      if (datesModal) {
        datesModal.onclick = (e) => {
          if (e.target.id === 'dates-modal') {
            datesModal.classList.add('hidden');
            datesModal.classList.remove('flex');
          }
        };
      }
      if (rollRandomBtn) {
        rollRandomBtn.onclick = () => this.dateIdeas.rollRandom();
      }

      document.querySelectorAll('.date-filter-tab').forEach(tab => {
        tab.onclick = () => {
          document.querySelectorAll('.date-filter-tab').forEach(t => {
            t.classList.remove('active', 'bg-rose-500', 'text-white', 'shadow-sm');
            t.classList.add('bg-white', 'text-zinc-600', 'border', 'border-rose-100');
          });
          tab.classList.add('active', 'bg-rose-500', 'text-white', 'shadow-sm');
          tab.classList.remove('bg-white', 'text-zinc-600', 'border', 'border-rose-100');
          const cat = tab.getAttribute('data-cat');
          this.dateIdeas.render(cat);
        };
      });

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
              detectedMessages.push(`Локация: ${placeName}`);
            }
          }

          if (detectedMessages.length > 0 && exifBadge && exifText) {
            exifText.innerText = `Определено по снимку: ${detectedMessages.join(' • ')}`;
            exifBadge.classList.remove('hidden');
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
      this.renderCurrentView();

      saveBtn.disabled = false;
      saveBtn.innerText = 'Сохранить момент';
      document.getElementById('add-moment-modal').classList.add('hidden');
      document.getElementById('add-moment-modal').classList.remove('flex');
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
