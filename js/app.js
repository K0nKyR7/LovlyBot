// Main Application Logic
import { storage, compressImage } from './storage.js';
import { INITIAL_CONFIG, CATEGORIES } from './mockData.js';
import { LoveCounter } from './counter.js';
import { PetalEffect } from './petals.js';
import { ambientAudio } from './audio.js';
import { 
  renderTimelineCard, 
  renderGalleryCard, 
  renderLetterCard, 
  formatDateRu, 
  escapeHtml 
} from './components.js';

class LoveStoryApp {
  constructor() {
    this.moments = [];
    this.letters = [];
    this.currentView = 'timeline'; // 'timeline' | 'gallery' | 'letters'
    this.currentFilter = 'Все';
    this.currentPinInput = '';
    this.correctPin = INITIAL_CONFIG.defaultPin;
    this.isUnlocked = false;
    this.counter = null;
    this.petals = null;
    this.activeLightboxMoment = null;
    this.uploadedImageBlob = null;
    this.uploadedImageDataUrl = null;
  }

  async init() {
    // 1. Initialize DB & storage
    await storage.init();
    
    // Load PIN
    const savedPin = await storage.getSetting('pin');
    this.correctPin = savedPin || INITIAL_CONFIG.defaultPin;

    // Load Start Date
    const savedStartDate = await storage.getSetting('start_date') || INITIAL_CONFIG.startDate;
    this.counter = new LoveCounter(savedStartDate);

    // 2. Setup Petals canvas
    this.petals = new PetalEffect('petals-canvas');

    // 3. Check Lock State (SessionStorage keeps it unlocked while tab is open)
    const sessionUnlocked = sessionStorage.getItem('app_unlocked');
    if (sessionUnlocked === 'true') {
      this.unlockApp(false);
    } else {
      this.setupLockScreen();
    }

    // 4. Setup Event Listeners & Modals
    this.setupGlobalEvents();
    this.setupCounterTimer();
  }

  // === PIN CODE / LOCK SCREEN ===
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

    // Keyboard support for desktop
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
      // Shake animation
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

  // === DATA LOADING & RENDERING ===
  async loadAndRenderAll() {
    this.moments = await storage.getMoments();
    this.letters = await storage.getLetters();

    this.renderCategoryPills();
    this.renderCurrentView();
    this.updateCloudStatusIndicator();
  }

  renderCategoryPills() {
    const container = document.getElementById('category-pills');
    if (!container) return;

    container.innerHTML = CATEGORIES.map(cat => `
      <button 
        class="category-pill whitespace-nowrap px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
          this.currentFilter === cat 
            ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25' 
            : 'bg-white/80 text-zinc-600 hover:bg-rose-50 border border-rose-100'
        }"
        data-cat="${cat}"
      >
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
    if (this.currentFilter === 'Все') {
      return this.moments;
    }
    return this.moments.filter(m => m.category === this.currentFilter);
  }

  renderCurrentView() {
    const timelineView = document.getElementById('timeline-view');
    const galleryView = document.getElementById('gallery-view');
    const lettersView = document.getElementById('letters-view');
    const filterSection = document.getElementById('filter-section');

    timelineView.classList.add('hidden');
    galleryView.classList.add('hidden');
    lettersView.classList.add('hidden');

    if (this.currentView === 'timeline') {
      timelineView.classList.remove('hidden');
      filterSection.classList.remove('hidden');
      this.renderTimeline();
    } else if (this.currentView === 'gallery') {
      galleryView.classList.remove('hidden');
      filterSection.classList.remove('hidden');
      this.renderGallery();
    } else if (this.currentView === 'letters') {
      lettersView.classList.remove('hidden');
      filterSection.classList.add('hidden');
      this.renderLetters();
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

  renderLetters() {
    const grid = document.getElementById('letters-grid');
    if (!grid) return;

    grid.innerHTML = this.letters.map(l => renderLetterCard(l)).join('');

    // Bind open letter modal
    grid.querySelectorAll('.open-letter-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const letter = this.letters.find(l => l.id === id);
        if (letter) this.showLetterModal(letter);
      };
    });

    // Bind delete letter
    grid.querySelectorAll('.delete-letter-btn').forEach(btn => {
      btn.onclick = async () => {
        if (confirm('Удалить это письмо?')) {
          const id = btn.getAttribute('data-id');
          await storage.deleteLetter(id);
          this.letters = await storage.getLetters();
          this.renderLetters();
        }
      };
    });
  }

  bindMomentActions() {
    // Like button
    document.querySelectorAll('.like-btn').forEach(btn => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const updated = await storage.toggleLike(id);
        if (updated) {
          const idx = this.moments.findIndex(m => m.id === id);
          if (idx !== -1) this.moments[idx] = updated;
          this.renderCurrentView();
        }
      };
    });

    // Delete moment
    document.querySelectorAll('.delete-moment-btn').forEach(btn => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        if (confirm('Точно удалить это воспоминание?')) {
          const id = btn.getAttribute('data-id');
          await storage.deleteMoment(id);
          this.moments = await storage.getMoments();
          this.renderCurrentView();
        }
      };
    });

    // Lightbox triggers
    document.querySelectorAll('.moment-image-trigger').forEach(el => {
      el.onclick = () => {
        const id = el.getAttribute('data-id');
        const moment = this.moments.find(m => m.id === id);
        if (moment) this.openLightbox(moment);
      };
    });
  }

  // === COUNTER TIMER ===
  setupCounterTimer() {
    const update = () => {
      if (!this.counter) return;
      const stats = this.counter.getExactDifference();

      // Days big counter
      const elTotalDays = document.getElementById('counter-total-days');
      if (elTotalDays) elTotalDays.innerText = stats.totalDays.toLocaleString('ru-RU');

      // Breakdown numbers
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

      // Next Anniversary banner
      const elAnniversary = document.getElementById('next-anniversary-badge');
      if (elAnniversary) {
        elAnniversary.innerText = `До следующей годовщины (${stats.anniversaryNumber} года): ${stats.nextAnniversaryDays} ${LoveCounter.pluralize(stats.nextAnniversaryDays, 'день', 'дня', 'дней')}`;
      }
    };

    update();
    setInterval(update, 1000);
  }

  // === LIGHTBOX ===
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

  // === LETTER MODAL ===
  showLetterModal(letter) {
    const modal = document.getElementById('letter-modal');
    const title = document.getElementById('letter-modal-title');
    const content = document.getElementById('letter-modal-content');
    const badge = document.getElementById('letter-modal-badge');

    title.innerText = letter.triggerTitle;
    content.innerText = letter.content;
    badge.innerText = letter.badge || 'Для тебя';

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  closeLetterModal() {
    const modal = document.getElementById('letter-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }

  // === GLOBAL EVENT LISTENERS ===
  setupGlobalEvents() {
    // View Tab Switcher (Лента, Галерея, Письма)
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

    // Music Toggle
    const musicBtn = document.getElementById('music-toggle-btn');
    if (musicBtn) {
      musicBtn.onclick = () => {
        const isPlaying = ambientAudio.toggle();
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

    // Petals Toggle
    const petalsBtn = document.getElementById('petals-toggle-btn');
    if (petalsBtn) {
      petalsBtn.onclick = () => {
        const active = this.petals.toggle();
        petalsBtn.classList.toggle('text-rose-500', active);
      };
    }

    // Lightbox Events
    document.getElementById('lightbox-close-btn').onclick = () => this.closeLightbox();
    document.getElementById('lightbox-prev-btn').onclick = () => this.navigateLightbox(-1);
    document.getElementById('lightbox-next-btn').onclick = () => this.navigateLightbox(1);
    document.getElementById('lightbox-modal').onclick = (e) => {
      if (e.target.id === 'lightbox-modal') this.closeLightbox();
    };

    // Letter Modal Close
    document.getElementById('letter-modal-close-btn').onclick = () => this.closeLetterModal();
    document.getElementById('letter-modal').onclick = (e) => {
      if (e.target.id === 'letter-modal') this.closeLetterModal();
    };

    // Add Moment Modal Open/Close
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

    // Add Moment Image Picker & Drag and drop
    const fileInput = document.getElementById('moment-file-input');
    const dropZone = document.getElementById('moment-dropzone');
    const imgPreview = document.getElementById('moment-img-preview');
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

    // Remove photo preview button
    document.getElementById('remove-photo-btn').onclick = () => {
      this.uploadedImageBlob = null;
      this.uploadedImageDataUrl = null;
      previewContainer.classList.add('hidden');
      dropZone.classList.remove('hidden');
      fileInput.value = '';
    };

    // Save Moment Form Submit
    document.getElementById('add-moment-form').onsubmit = async (e) => {
      e.preventDefault();
      await this.saveNewMoment();
    };

    // Add Letter Modal Open/Close
    const addLetterModal = document.getElementById('add-letter-modal');
    document.getElementById('open-add-letter-btn').onclick = () => {
      document.getElementById('add-letter-form').reset();
      addLetterModal.classList.remove('hidden');
      addLetterModal.classList.add('flex');
    };
    document.getElementById('close-add-letter-btn').onclick = () => {
      addLetterModal.classList.add('hidden');
      addLetterModal.classList.remove('flex');
    };
    document.getElementById('add-letter-form').onsubmit = async (e) => {
      e.preventDefault();
      await this.saveNewLetter();
    };

    // Settings Modal Open/Close
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

    // Backup Export & Import
    document.getElementById('export-backup-btn').onclick = () => storage.exportBackup();
    const backupFileInput = document.getElementById('import-backup-input');
    document.getElementById('import-backup-btn').onclick = () => backupFileInput.click();
    backupFileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        const text = await file.text();
        const success = await storage.importBackup(text);
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
      // Compress client-side
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

    await storage.saveMoment(newMoment, this.uploadedImageBlob);
    this.moments = await storage.getMoments();
    this.renderCurrentView();

    saveBtn.disabled = false;
    saveBtn.innerText = 'Сохранить момент';
    document.getElementById('add-moment-modal').classList.add('hidden');
    document.getElementById('add-moment-modal').classList.remove('flex');
  }

  async saveNewLetter() {
    const triggerTitle = document.getElementById('letter-title-input').value.trim();
    const badge = document.getElementById('letter-badge-input').value.trim();
    const content = document.getElementById('letter-content-input').value.trim();

    if (!triggerTitle || !content) {
      alert('Заполните заголовок и текст письма!');
      return;
    }

    const newLetter = {
      id: `letter-${Date.now()}`,
      triggerTitle,
      badge: badge || 'Для тебя',
      content,
      createdAt: new Date().toISOString()
    };

    await storage.saveLetter(newLetter);
    this.letters = await storage.getLetters();
    this.renderLetters();

    document.getElementById('add-letter-modal').classList.add('hidden');
    document.getElementById('add-letter-modal').classList.remove('flex');
  }

  async populateSettingsForm() {
    const pin = await storage.getSetting('pin') || INITIAL_CONFIG.defaultPin;
    const startDate = await storage.getSetting('start_date') || INITIAL_CONFIG.startDate;
    const supabaseUrl = await storage.getSetting('supabase_url') || '';
    const supabaseKey = await storage.getSetting('supabase_key') || '';

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

    await storage.saveSetting('pin', pin);
    this.correctPin = pin;

    if (startDate) {
      await storage.saveSetting('start_date', `${startDate}T00:00:00`);
      this.counter.setStartDate(`${startDate}T00:00:00`);
    }

    await storage.saveSetting('supabase_url', supabaseUrl);
    await storage.saveSetting('supabase_key', supabaseKey);

    await storage.initSupabaseIfConfigured();
    this.updateCloudStatusIndicator();

    alert('Настройки успешно сохранены!');
    document.getElementById('settings-modal').classList.add('hidden');
    document.getElementById('settings-modal').classList.remove('flex');
  }

  updateCloudStatusIndicator() {
    const el = document.getElementById('cloud-sync-status');
    if (!el) return;
    if (storage.isCloudConfigured()) {
      el.innerHTML = `<span class="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full"><i class="fa-solid fa-cloud"></i> Облако подключено</span>`;
    } else {
      el.innerHTML = `<span class="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full" title="Фото хранятся локально в браузере. В настройках можно подключить Supabase для облачной синхронизации с телефоном"><i class="fa-solid fa-hard-drive"></i> Локально (Offline)</span>`;
    }
  }
}

// Start app once DOM loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new LoveStoryApp();
  app.init();
});
