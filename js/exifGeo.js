// ============================================================
// EXIF METADATA PARSER & REVERSE GEOCODING ENGINE
// Extracts GPS coordinates, altitude, and date taken from photo files
// ============================================================

export class ExifGeoEngine {
  constructor() {
    this.geoCache = new Map();
  }

  // Parse Date and GPS coordinates from ArrayBuffer / File
  async extractMetadata(file) {
    try {
      const buffer = await file.arrayBuffer();
      const view = new DataView(buffer);

      // Verify JPEG SOI (0xFFD8)
      if (view.getUint16(0) !== 0xFFD8) {
        return { hasExif: false };
      }

      let offset = 2;
      const length = view.byteLength;

      while (offset < length) {
        if (view.getUint8(offset) !== 0xFF) {
          break;
        }

        const marker = view.getUint8(offset + 1);

        // APP1 Marker (0xE1 = 225)
        if (marker === 0xE1) {
          const exifHeader = view.getUint32(offset + 4);
          // Check "Exif" ASCII (0x45786966)
          if (exifHeader === 0x45786966) {
            const tiffOffset = offset + 10;
            return this.parseTiff(view, tiffOffset);
          }
        }

        // Move to next marker
        const markerLength = view.getUint16(offset + 2);
        offset += 2 + markerLength;
      }

      return { hasExif: false };
    } catch (err) {
      console.warn('EXIF parsing failed gracefully:', err);
      return { hasExif: false };
    }
  }

  parseTiff(view, tiffOffset) {
    const endianness = view.getUint16(tiffOffset);
    const isLittleEndian = endianness === 0x4949; // "II"

    // Verify 42 magic number
    if (view.getUint16(tiffOffset + 2, isLittleEndian) !== 0x002A) {
      return { hasExif: false };
    }

    const firstIFDOffset = view.getUint32(tiffOffset + 4, isLittleEndian);
    const ifd0 = tiffOffset + firstIFDOffset;

    let subExifOffset = null;
    let gpsIFDOffset = null;

    // Read IFD0 tags
    const numEntries = view.getUint16(ifd0, isLittleEndian);
    for (let i = 0; i < numEntries; i++) {
      const entryOffset = ifd0 + 2 + i * 12;
      const tag = view.getUint16(entryOffset, isLittleEndian);
      const val = view.getUint32(entryOffset + 8, isLittleEndian);

      if (tag === 0x8769) {
        subExifOffset = tiffOffset + val; // SubIFD
      } else if (tag === 0x8825) {
        gpsIFDOffset = tiffOffset + val; // GPS IFD
      }
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
      // Format: "YYYY:MM:DD HH:MM:SS" -> "YYYY-MM-DD"
      const parts = dateTimeOriginal.split(' ')[0].split(':');
      if (parts.length === 3) {
        parsedDate = `${parts[0]}-${parts[1]}-${parts[2]}`;
      }
    }

    return {
      hasExif: true,
      originalDate: parsedDate,
      dateTimeOriginal,
      gps: gpsData
    };
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
        for (let j = 0; j < count - 1; j++) {
          str += String.fromCharCode(view.getUint8(strOffset + j));
        }
        return str.trim();
      }
    }
    return null;
  }

  readGpsData(view, gpsOffset, isLittleEndian, tiffOffset) {
    const numEntries = view.getUint16(gpsOffset, isLittleEndian);
    let lat = null, latRef = 'N';
    let lon = null, lonRef = 'E';

    for (let i = 0; i < numEntries; i++) {
      const entry = gpsOffset + 2 + i * 12;
      const tag = view.getUint16(entry, isLittleEndian);

      if (tag === 0x0001) { // GPSLatitudeRef
        latRef = String.fromCharCode(view.getUint8(entry + 8));
      } else if (tag === 0x0002) { // GPSLatitude
        lat = this.readRationalCoordinates(view, entry, isLittleEndian, tiffOffset);
      } else if (tag === 0x0003) { // GPSLongitudeRef
        lonRef = String.fromCharCode(view.getUint8(entry + 8));
      } else if (tag === 0x0004) { // GPSLongitude
        lon = this.readRationalCoordinates(view, entry, isLittleEndian, tiffOffset);
      }
    }

    if (lat !== null && lon !== null) {
      let finalLat = lat[0] + lat[1] / 60 + lat[2] / 3600;
      let finalLon = lon[0] + lon[1] / 60 + lon[2] / 3600;

      if (latRef === 'S') finalLat = -finalLat;
      if (lonRef === 'W') finalLon = -finalLon;

      return {
        lat: Number(finalLat.toFixed(6)),
        lng: Number(finalLon.toFixed(6))
      };
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

  // Reverse Geocoding with local cache
  async reverseGeocode(lat, lng) {
    const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
    if (this.geoCache.has(cacheKey)) {
      return this.geoCache.get(cacheKey);
    }

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1&accept-language=ru`;
      const response = await fetch(url, {
        headers: { 'Accept-Language': 'ru' }
      });
      if (!response.ok) return null;
      const data = await response.json();

      if (data && data.address) {
        const addr = data.address;
        const city = addr.city || addr.town || addr.village || addr.municipality || addr.state;
        const place = addr.road || addr.suburb || addr.amenity || addr.tourism || '';
        const country = addr.country || '';

        let formatted = '';
        if (city && place) {
          formatted = `${city}, ${place}`;
        } else if (city && country) {
          formatted = `${city}, ${country}`;
        } else {
          formatted = city || data.display_name.split(',').slice(0, 2).join(',');
        }

        this.geoCache.set(cacheKey, formatted);
        return formatted;
      }
    } catch (e) {
      console.warn('Reverse geocode failed:', e);
    }

    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

export const exifGeo = new ExifGeoEngine();
