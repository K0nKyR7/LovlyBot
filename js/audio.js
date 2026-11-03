// Romantic Ambient Audio Synthesizer & Player
// Generates soft, warm acoustic ambient chords via Web Audio API or plays custom audio

class AmbientAudio {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.timer = null;
    this.customAudio = null;
    this.customUrl = '';
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

  // Soft romantic pentatonic piano-like chime chords
  playTone(freq, duration = 3.5, timeOffset = 0) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime + timeOffset;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Warm low-pass filter
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(650, now);
    filter.frequency.exponentialRampToValueAtTime(120, now + duration);

    // Sine/Triangle blend for warm electric piano / celesta feel
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

  // Soft cyclical chord progression in F Major / D Minor
  // Chords: Dm9 -> BbMaj7 -> FMaj9 -> C6
  startSynthAtmosphere() {
    this.initContext();
    this.isPlaying = true;

    const chords = [
      [220, 261.63, 329.63, 392.00, 440], // Dm9 (D3, C4, E4, G4, A4)
      [233.08, 293.66, 349.23, 440.00, 523.25], // BbMaj7 (Bb3, D4, F4, A4, C5)
      [174.61, 261.63, 329.63, 349.23, 440.00], // FMaj9 (F3, C4, E4, F4, A4)
      [196.00, 246.94, 293.66, 329.63, 392.00]  // C6/G (G3, B3, D4, E4, G4)
    ];

    let chordIdx = 0;

    const triggerNextChord = () => {
      if (!this.isPlaying) return;
      const notes = chords[chordIdx];
      // Arpeggiate slightly
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
    if (this.customAudio) {
      this.customAudio.pause();
    }
  }

  toggle() {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      if (this.customUrl) {
        this.playCustom(this.customUrl);
      } else {
        this.startSynthAtmosphere();
      }
      return true;
    }
  }

  playCustom(url) {
    this.stop();
    this.customUrl = url;
    if (!this.customAudio) {
      this.customAudio = new Audio(url);
      this.customAudio.loop = true;
    } else {
      this.customAudio.src = url;
    }
    this.customAudio.volume = this.volume;
    this.customAudio.play().catch(e => console.warn('Audio play error:', e));
    this.isPlaying = true;
  }
}

export const ambientAudio = new AmbientAudio();
