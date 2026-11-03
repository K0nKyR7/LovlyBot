// UI Component Renderers and Helpers
import { LoveCounter } from './counter.js';

export function formatDateRu(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  return date.toLocaleDateString('ru-RU', options);
}

// Timeline Moment Card
export function renderTimelineCard(moment) {
  const isLiked = moment.isLiked;
  const likesCount = moment.likes || 0;

  return `
    <div class="relative pl-6 sm:pl-10 pb-12 group last:pb-2" data-id="${moment.id}">
      <!-- Timeline Node Line -->
      <div class="absolute left-0 top-3 -ml-[1px] w-[2px] h-full bg-rose-200/80 group-last:h-4"></div>
      
      <!-- Timeline Heart Dot -->
      <div class="absolute left-0 top-2 -ml-[9px] w-5 h-5 rounded-full bg-white border-2 border-rose-500 flex items-center justify-center shadow-sm group-hover:scale-125 transition-transform duration-300">
        <i class="fa-solid fa-heart text-[8px] text-rose-500"></i>
      </div>

      <!-- Card Content -->
      <div class="glass-card glass-card-hover rounded-2xl overflow-hidden shadow-sm transition-all duration-300 border border-rose-100">
        <!-- Image Container -->
        <div class="relative overflow-hidden aspect-[16/10] sm:aspect-[16/9] bg-rose-50 cursor-pointer moment-image-trigger" data-id="${moment.id}">
          <img 
            src="${moment.imageUrl}" 
            alt="${escapeHtml(moment.title)}" 
            loading="lazy" 
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-60"></div>
          
          <!-- Category & Date Badges on Image -->
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

        <!-- Text details -->
        <div class="p-5">
          <div class="flex items-start justify-between gap-3 mb-2">
            <h3 class="text-xl sm:text-2xl font-serif-romantic font-bold text-zinc-800 leading-tight">
              ${escapeHtml(moment.title)}
            </h3>
            <div class="flex items-center gap-1">
              <!-- Like button -->
              <button 
                class="like-btn flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${isLiked ? 'bg-rose-50 text-rose-600' : 'bg-zinc-50 text-zinc-500 hover:text-rose-500 hover:bg-rose-50/60'}" 
                data-id="${moment.id}" 
                title="Любимый момент"
              >
                <i class="${isLiked ? 'fa-solid text-rose-500 animate-heart-pop' : 'fa-regular'} fa-heart text-base"></i>
                <span>${likesCount}</span>
              </button>
              <!-- Delete button -->
              <button 
                class="delete-moment-btn p-2 text-zinc-300 hover:text-rose-500 transition-colors rounded-full hover:bg-rose-50"
                data-id="${moment.id}" 
                title="Удалить"
              >
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

// Masonry Gallery Card
export function renderGalleryCard(moment) {
  const isLiked = moment.isLiked;

  return `
    <div class="masonry-item relative group rounded-2xl overflow-hidden shadow-sm glass-card border border-rose-100 cursor-pointer moment-image-trigger" data-id="${moment.id}">
      <img 
        src="${moment.imageUrl}" 
        alt="${escapeHtml(moment.title)}" 
        loading="lazy" 
        class="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
      />
      
      <!-- Overlay Gradient on hover/tap -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 text-white">
        <div class="flex justify-between items-center">
          <span class="px-2.5 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-md">
            ${escapeHtml(moment.category || 'Фото')}
          </span>
          <button 
            class="like-btn p-2 rounded-full backdrop-blur-md bg-white/20 hover:bg-white/40 text-rose-400" 
            data-id="${moment.id}"
            onclick="event.stopPropagation()"
          >
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

// Love Letter / Envelope Card
export function renderLetterCard(letter) {
  return `
    <div class="envelope-card glass-card rounded-2xl p-6 border border-rose-200/70 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
      <div class="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-rose-200/40 to-pink-300/30 rounded-bl-full pointer-events-none"></div>
      
      <!-- Envelope Icon / Badge -->
      <div class="flex items-center justify-between mb-4">
        <span class="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">
          ${escapeHtml(letter.badge || 'Для тебя')}
        </span>
        <button class="delete-letter-btn text-zinc-300 hover:text-rose-500 transition-colors p-1" data-id="${letter.id}" title="Удалить">
          <i class="fa-regular fa-trash-can text-xs"></i>
        </button>
      </div>

      <div class="mb-4">
        <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-400 flex items-center justify-center text-white shadow-md shadow-rose-500/25 mb-3 group-hover:scale-110 transition-transform">
          <i class="fa-solid fa-envelope-open-text text-xl"></i>
        </div>
        <h3 class="text-lg font-bold text-zinc-800 font-serif-romantic leading-snug">
          ${escapeHtml(letter.triggerTitle)}
        </h3>
      </div>

      <button 
        class="open-letter-btn w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 transition-all flex items-center justify-center gap-2 shadow-sm"
        data-id="${letter.id}"
      >
        <span>Распечатать конверт</span>
        <i class="fa-solid fa-arrow-right text-xs"></i>
      </button>
    </div>
  `;
}

// Escape HTML utility to prevent injection
export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
