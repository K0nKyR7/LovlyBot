// ============================================================
// INTERACTIVE MEMORY MAP ENGINE (LEAFLET + CUSTOM PINS)
// ============================================================

export class MemoryMapEngine {
  constructor(containerId, onMomentClick) {
    this.containerId = containerId;
    this.map = null;
    this.markersGroup = null;
    this.onMomentClick = onMomentClick;
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized || !document.getElementById(this.containerId)) return;
    if (typeof L === 'undefined') {
      console.warn('Leaflet is not loaded yet');
      return;
    }

    // Default center (e.g. Moscow/Central coordinates)
    this.map = L.map(this.containerId, {
      zoomControl: true,
      scrollWheelZoom: true
    }).setView([55.7558, 37.6173], 6);

    // CartoDB Positron - Clean, elegant, light aesthetic tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(this.map);

    this.markersGroup = L.layerGroup().addTo(this.map);
    this.isInitialized = true;
  }

  // Create customized glowing heart pin icon
  createHeartIcon(moment) {
    return L.divIcon({
      className: 'custom-map-heart-marker',
      html: `
        <div class="relative group cursor-pointer -translate-x-1/2 -translate-y-full">
          <!-- Pin body -->
          <div class="w-10 h-10 rounded-full bg-white border-2 border-rose-500 shadow-lg flex items-center justify-center text-rose-500 hover:scale-110 hover:bg-rose-500 hover:text-white transition-all duration-300">
            <i class="fa-solid fa-heart text-base animate-pulse"></i>
          </div>
          <!-- Pin pointer triangle -->
          <div class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-rose-500 mx-auto -mt-[1px]"></div>
        </div>
      `,
      iconSize: [40, 48],
      iconAnchor: [20, 48],
      popupAnchor: [0, -46]
    });
  }

  renderMoments(moments) {
    if (!this.map) this.init();
    if (!this.map || !this.markersGroup) return;

    this.markersGroup.clearLayers();
    const momentsWithCoords = moments.filter(m => m.lat && m.lng);

    if (momentsWithCoords.length === 0) {
      return;
    }

    const bounds = [];

    momentsWithCoords.forEach(moment => {
      const latLng = [moment.lat, moment.lng];
      bounds.push(latLng);

      const marker = L.marker(latLng, {
        icon: this.createHeartIcon(moment)
      });

      // Custom aesthetic popup card
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
          <button 
            class="map-popup-view-btn w-full py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-sm transition-colors"
            data-id="${moment.id}"
          >
            Открыть воспоминание
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: 'custom-map-popup',
        closeButton: false,
        maxWidth: 240
      });

      marker.on('popupopen', () => {
        const btn = document.querySelector(`.map-popup-view-btn[data-id="${moment.id}"]`);
        if (btn) {
          btn.onclick = () => {
            if (this.onMomentClick) this.onMomentClick(moment);
          };
        }
      });

      this.markersGroup.addLayer(marker);
    });

    if (bounds.length > 0) {
      this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }

  invalidateSize() {
    if (this.map) {
      setTimeout(() => this.map.invalidateSize(), 200);
    }
  }
}
