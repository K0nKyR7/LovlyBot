// ============================================================
// WEB-TO-PRINT PHOTOBOOK ENGINE
// Compiles moments into high-resolution printable photobook spreads
// ============================================================

export class PhotobookGenerator {
  constructor() {
    this.currentYear = 'all';
  }

  generateSpreads(moments, config = {}) {
    const startDate = config.startDate || '2024-12-21';
    const sorted = [...moments].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Cover Spread
    const spreads = [
      this.renderCoverSpread(startDate, sorted.length),
      this.renderDedicationSpread(config.quote),
      ...this.renderMomentSpreads(sorted),
      this.renderBackCoverSpread()
    ];

    return spreads;
  }

  renderCoverSpread(startDate, totalMoments) {
    return `
      <div class="photobook-page photobook-cover flex flex-col items-center justify-between p-12 text-center bg-[#FAF4F0] border-4 border-[#E8DCD5] rounded-xl shadow-lg relative overflow-hidden">
        <div class="absolute inset-4 border border-[#D5C2B8] pointer-events-none"></div>
        
        <div class="mt-8">
          <span class="text-xs uppercase tracking-[0.3em] text-[#9A7B70] font-semibold">Архив воспоминаний</span>
          <div class="w-12 h-0.5 bg-[#C9A99D] mx-auto mt-2"></div>
        </div>

        <div class="my-auto py-8">
          <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-tr from-rose-500 to-pink-400 flex items-center justify-center text-white shadow-xl">
            <i class="fa-solid fa-heart text-3xl"></i>
          </div>
          <h1 class="text-4xl sm:text-5xl font-serif-romantic font-bold text-[#3E302B] tracking-tight mb-3">
            Наша История
          </h1>
          <p class="text-sm font-serif-romantic text-[#7D645B] italic">
            Том I • с 21 декабря 2024 года
          </p>
        </div>

        <div class="mb-6">
          <p class="text-xs text-[#9A7B70] tracking-widest font-medium uppercase">
            Коллекция из ${totalMoments} памятных моментов
          </p>
        </div>
      </div>
    `;
  }

  renderDedicationSpread(quote) {
    return `
      <div class="photobook-page photobook-spread grid grid-cols-1 sm:grid-cols-2 gap-8 p-10 bg-white border border-rose-100 rounded-xl shadow-md">
        <!-- Left Page: Minimalist Graphic -->
        <div class="flex flex-col items-center justify-center p-8 border-r border-rose-50 text-center">
          <div class="w-28 h-28 rounded-full border border-rose-200 p-2 mb-4">
            <div class="w-full h-full rounded-full bg-rose-50 flex items-center justify-center text-rose-400">
              <i class="fa-solid fa-infinity text-3xl"></i>
            </div>
          </div>
          <h3 class="font-serif-romantic text-2xl font-bold text-zinc-800 mb-1">21.12.2024</h3>
          <p class="text-xs text-zinc-400 uppercase tracking-widest">День, когда всё изменилось</p>
        </div>

        <!-- Right Page: Romantic Letter -->
        <div class="flex flex-col justify-center p-8 text-center sm:text-left">
          <span class="text-xs text-rose-500 uppercase tracking-widest font-semibold mb-4">Посвящение</span>
          <p class="font-handwriting text-3xl sm:text-4xl text-zinc-700 leading-relaxed mb-6">
            «${quote || 'В тебе есть весь мой мир, всё мое счастье и всё моё спокойствие.'}»
          </p>
          <div class="w-16 h-0.5 bg-rose-300 mb-4"></div>
          <p class="text-xs text-zinc-400 leading-relaxed font-light">
            Эта книга — наше осязаемое доказательство того, сколько тепла, смеха, путешествий и объятий мы разделили друг с другом.
          </p>
        </div>
      </div>
    `;
  }

  renderMomentSpreads(moments) {
    const spreads = [];

    // Group moments in pairs for facing pages
    for (let i = 0; i < moments.length; i += 2) {
      const m1 = moments[i];
      const m2 = moments[i + 1] || null;

      spreads.push(`
        <div class="photobook-page photobook-spread grid grid-cols-1 sm:grid-cols-2 gap-6 p-8 bg-white border border-rose-100 rounded-xl shadow-md">
          <!-- Left Spread Item -->
          <div class="flex flex-col h-full bg-[#FAF7F5] rounded-2xl p-5 border border-rose-100/60 overflow-hidden">
            <div class="aspect-[16/11] rounded-xl overflow-hidden mb-4 bg-zinc-100 shadow-sm">
              <img src="${m1.imageUrl}" alt="${m1.title}" class="w-full h-full object-cover" />
            </div>
            <div class="flex items-center justify-between text-xs text-rose-600 font-medium mb-1">
              <span>${m1.date}</span>
              ${m1.location ? `<span class="truncate max-w-[140px] text-zinc-500">📍 ${m1.location}</span>` : ''}
            </div>
            <h3 class="font-serif-romantic text-xl font-bold text-zinc-800 mb-2 leading-tight">${m1.title}</h3>
            <p class="text-xs sm:text-sm text-zinc-600 leading-relaxed font-light line-clamp-4">${m1.description || ''}</p>
          </div>

          <!-- Right Spread Item (or single-page layout if odd) -->
          ${m2 ? `
            <div class="flex flex-col h-full bg-[#FAF7F5] rounded-2xl p-5 border border-rose-100/60 overflow-hidden">
              <div class="aspect-[16/11] rounded-xl overflow-hidden mb-4 bg-zinc-100 shadow-sm">
                <img src="${m2.imageUrl}" alt="${m2.title}" class="w-full h-full object-cover" />
              </div>
              <div class="flex items-center justify-between text-xs text-rose-600 font-medium mb-1">
                <span>${m2.date}</span>
                ${m2.location ? `<span class="truncate max-w-[140px] text-zinc-500">📍 ${m2.location}</span>` : ''}
              </div>
              <h3 class="font-serif-romantic text-xl font-bold text-zinc-800 mb-2 leading-tight">${m2.title}</h3>
              <p class="text-xs sm:text-sm text-zinc-600 leading-relaxed font-light line-clamp-4">${m2.description || ''}</p>
            </div>
          ` : `
            <div class="flex flex-col items-center justify-center p-8 text-center rounded-2xl border-2 border-dashed border-rose-200">
              <i class="fa-solid fa-heart text-rose-300 text-3xl mb-3"></i>
              <p class="font-serif-romantic text-lg font-bold text-zinc-700">Каждый день с тобой — это новая глава</p>
              <p class="text-xs text-zinc-400 mt-1">Место для следующего фото...</p>
            </div>
          `}
        </div>
      `);
    }

    return spreads;
  }

  renderBackCoverSpread() {
    return `
      <div class="photobook-page photobook-cover flex flex-col items-center justify-between p-12 text-center bg-[#FAF4F0] border-4 border-[#E8DCD5] rounded-xl shadow-lg relative">
        <div class="absolute inset-4 border border-[#D5C2B8] pointer-events-none"></div>
        <div></div>
        
        <div class="my-auto">
          <div class="w-12 h-12 mx-auto mb-4 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shadow-sm">
            <i class="fa-solid fa-heart text-xl"></i>
          </div>
          <h2 class="text-3xl font-serif-romantic font-bold text-[#3E302B] mb-2">
            Продолжение следует...
          </h2>
          <p class="font-handwriting text-2xl text-[#7D645B]">
            Я люблю тебя всё сильнее с каждым днем
          </p>
        </div>

        <div class="text-[11px] text-[#9A7B70] tracking-wider uppercase">
          Напечатано специально для нас двоих • 2026
        </div>
      </div>
    `;
  }
}

export const photobook = new PhotobookGenerator();
