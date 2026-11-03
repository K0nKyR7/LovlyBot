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
    quote: "В тебе есть весь мой мир, всё мое счастье и всё моё спокойствие."
  };

  const INITIAL_MOMENTS = [
    {
      id: "moment-1",
      title: "День, когда всё началось",
      date: "2024-12-21",
      category: "Памятные даты",
      location: "Тот самый зимний вечер",
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
      location: "Уютная кофейня в центре",
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
      location: "Поездка на выходные",
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
      location: "Парк у воды",
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
      location: "Дома на кухне",
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
      const supabaseUrl = await this.getSetting('supabase_url');
      const supabaseKey = await this.getSetting('supabase_key');
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

    async deleteMoment(id) {
      await this.deleteFromStore(STORE_MOMENTS, id);
      if (this.supabaseClient) {
        try {
          await this.supabaseClient.from('moments').delete().eq('id', id);
        } catch (e) {}
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
    return `
      <div class="relative pl-6 sm:pl-10 pb-12 group last:pb-2" data-id="${moment.id}">
        <div class="absolute left-0 top-3 -ml-[1px] w-[2px] h-full bg-rose-200/80 group-last:h-4"></div>
        <div class="absolute left-0 top-2 -ml-[9px] w-5 h-5 rounded-full bg-white border-2 border-rose-500 flex items-center justify-center shadow-sm group-hover:scale-125 transition-transform duration-300">
          <i class="fa-solid fa-heart text-[8px] text-rose-500"></i>
        </div>
        <div class="glass-card glass-card-hover rounded-2xl overflow-hidden shadow-sm transition-all duration-300 border border-rose-100">
          <div class="relative overflow-hidden aspect-[16/10] sm:aspect-[16/9] bg-rose-50 cursor-pointer moment-image-trigger" data-id="${moment.id}">
            <img src="${moment.imageUrl}" alt="${escapeHtml(moment.title)}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-60"></div>
            <div class="absolute top-3 left-3 flex flex-wrap gap-2">
              <span class="px-2.5 py-1 rounded-full text-xs font-medium bg-white/90 backdrop-blur-md text-rose-700 shadow-sm">
                ${escapeHtml(moment.category || 'Воспоминание')}
              </span>
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
              ${escapeHtml(moment.description || '')}
            </p>
          </div>
        </div>
      </div>
    `;
  }

  function renderGalleryCard(moment) {
    const isLiked = moment.isLiked;
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

  // --- 8. MAIN APP CONTROLLER ---
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
      this.activeLightboxMoment = null;
      this.uploadedImageBlob = null;
      this.uploadedImageDataUrl = null;
    }

    async init() {
      await this.storage.init();
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
      const filterSection = document.getElementById('filter-section');

      timelineView.classList.add('hidden');
      galleryView.classList.add('hidden');

      if (this.currentView === 'timeline') {
        timelineView.classList.remove('hidden');
        filterSection.classList.remove('hidden');
        this.renderTimeline();
      } else if (this.currentView === 'gallery') {
        galleryView.classList.remove('hidden');
        filterSection.classList.remove('hidden');
        this.renderGallery();
      }
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
            await this.storage.deleteMoment(id);
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
    }

    async handleSelectedPhoto(file) {
      try {
        const compressed = await compressImage(file, 1600, 0.85);
        this.uploadedImageBlob = compressed.blob;
        this.uploadedImageDataUrl = compressed.dataUrl;

        const dropZone = document.getElementById('moment-dropzone');
        const previewContainer = document.getElementById('preview-container');
        const imgPreview = document.getElementById('moment-img-preview');

        imgPreview.src = compressed.dataUrl;
        dropZone.classList.add('hidden');
        previewContainer.classList.remove('hidden');
      } catch (err) {
        alert('Пожалуйста, выберите файл изображения');
      }
    }

    resetAddMomentForm() {
      document.getElementById('add-moment-form').reset();
      document.getElementById('moment-date-input').value = new Date().toISOString().slice(0, 10);
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
        description: description || '',
        imageUrl: this.uploadedImageDataUrl,
        likes: 1,
        isLiked: true,
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
      const supabaseUrl = await this.storage.getSetting('supabase_url') || '';
      const supabaseKey = await this.storage.getSetting('supabase_key') || '';

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
