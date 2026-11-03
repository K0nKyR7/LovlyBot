// Storage manager supporting IndexedDB (local, unlimited storage) & Supabase (cloud sync)
import { INITIAL_CONFIG, INITIAL_MOMENTS, INITIAL_LETTERS } from './mockData.js';

const DB_NAME = 'LoveStoryDB';
const DB_VERSION = 1;
const STORE_MOMENTS = 'moments';
const STORE_LETTERS = 'letters';
const STORE_SETTINGS = 'settings';

class StorageManager {
  constructor() {
    this.db = null;
    this.supabaseClient = null;
  }

  // Initialize IndexedDB
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_MOMENTS)) {
          db.createObjectStore(STORE_MOMENTS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_LETTERS)) {
          db.createObjectStore(STORE_LETTERS, { keyPath: 'id' });
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
        reject(event.target.error);
      };
    });
  }

  // Seed default moments and letters on first load
  async seedDefaultsIfNeeded() {
    const existingMoments = await this.getAllFromStore(STORE_MOMENTS);
    if (!existingMoments || existingMoments.length === 0) {
      for (const m of INITIAL_MOMENTS) {
        await this.putToStore(STORE_MOMENTS, m);
      }
    }

    const existingLetters = await this.getAllFromStore(STORE_LETTERS);
    if (!existingLetters || existingLetters.length === 0) {
      for (const l of INITIAL_LETTERS) {
        await this.putToStore(STORE_LETTERS, l);
      }
    }

    const pin = await this.getSetting('pin');
    if (!pin) {
      await this.saveSetting('pin', INITIAL_CONFIG.defaultPin);
    }
  }

  // Helper methods for IndexedDB
  async getAllFromStore(storeName) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async putToStore(storeName, value) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(value);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async deleteFromStore(storeName, id) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // Settings
  async getSetting(key) {
    return new Promise((resolve) => {
      const tx = this.db.transaction(STORE_SETTINGS, 'readonly');
      const store = tx.objectStore(STORE_SETTINGS);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ? req.result.value : null);
      req.onerror = () => resolve(null);
    });
  }

  async saveSetting(key, value) {
    return this.putToStore(STORE_SETTINGS, { key, value });
  }

  // Supabase init
  async initSupabaseIfConfigured() {
    const supabaseUrl = await this.getSetting('supabase_url');
    const supabaseKey = await this.getSetting('supabase_key');

    if (supabaseUrl && supabaseKey && window.supabase) {
      try {
        this.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
        console.log('Supabase initialized successfully!');
      } catch (e) {
        console.warn('Supabase initialization error:', e);
      }
    }
  }

  isCloudConfigured() {
    return !!this.supabaseClient;
  }

  // Get all moments (sorted by date descending)
  async getMoments() {
    if (this.supabaseClient) {
      try {
        const { data, error } = await this.supabaseClient
          .from('moments')
          .select('*')
          .order('date', { ascending: false });
        if (!error && data) {
          return data;
        }
      } catch (err) {
        console.warn('Supabase fetch failed, falling back to local DB', err);
      }
    }
    const moments = await this.getAllFromStore(STORE_MOMENTS);
    return moments.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  // Save new moment
  async saveMoment(moment, file = null) {
    let finalImageUrl = moment.imageUrl;

    // If a photo file was uploaded and Supabase is configured, upload to bucket
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
        console.warn('Failed to upload image to Supabase storage, using local preview', e);
      }
    }

    const momentToSave = {
      ...moment,
      imageUrl: finalImageUrl,
      updatedAt: new Date().toISOString()
    };

    // Save locally
    await this.putToStore(STORE_MOMENTS, momentToSave);

    // Save to Supabase if configured
    if (this.supabaseClient) {
      try {
        await this.supabaseClient.from('moments').upsert(momentToSave);
      } catch (e) {
        console.warn('Failed to sync moment to Supabase', e);
      }
    }

    return momentToSave;
  }

  // Toggle Like
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
      } catch (e) {
        console.warn('Cloud sync error for like:', e);
      }
    }

    return moment;
  }

  // Delete moment
  async deleteMoment(id) {
    await this.deleteFromStore(STORE_MOMENTS, id);
    if (this.supabaseClient) {
      try {
        await this.supabaseClient.from('moments').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase delete error:', e);
      }
    }
  }

  // Letters / Envelopes
  async getLetters() {
    if (this.supabaseClient) {
      try {
        const { data, error } = await this.supabaseClient
          .from('letters')
          .select('*');
        if (!error && data && data.length > 0) return data;
      } catch (e) {
        // fallback
      }
    }
    return this.getAllFromStore(STORE_LETTERS);
  }

  async saveLetter(letter) {
    await this.putToStore(STORE_LETTERS, letter);
    if (this.supabaseClient) {
      try {
        await this.supabaseClient.from('letters').upsert(letter);
      } catch (e) {
        console.warn('Supabase save letter error:', e);
      }
    }
    return letter;
  }

  async deleteLetter(id) {
    await this.deleteFromStore(STORE_LETTERS, id);
    if (this.supabaseClient) {
      try {
        await this.supabaseClient.from('letters').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase delete letter error:', e);
      }
    }
  }

  // Export all data as JSON
  async exportBackup() {
    const moments = await this.getAllFromStore(STORE_MOMENTS);
    const letters = await this.getAllFromStore(STORE_LETTERS);
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      moments,
      letters
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `love-story-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Import data from JSON
  async importBackup(jsonData) {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      if (data.moments && Array.isArray(data.moments)) {
        for (const m of data.moments) {
          await this.putToStore(STORE_MOMENTS, m);
        }
      }
      if (data.letters && Array.isArray(data.letters)) {
        for (const l of data.letters) {
          await this.putToStore(STORE_LETTERS, l);
        }
      }
      return true;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  }
}

// Client-side image compressor: scales high-res phone pictures down to ~1600px width/height and ~85% quality
export function compressImage(file, maxDimension = 1600, quality = 0.85) {
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

export const storage = new StorageManager();
