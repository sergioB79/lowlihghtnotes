/**
 * Low Light Notes — Ambient Piano
 * Sparse pentatonic notes triggered by interaction.
 * Web Audio API only, no dependencies.
 */

(function () {
  let ctx = null;
  let lastPlayed = 0;
  const MIN_INTERVAL = 600; // ms between notes

  // Pentatonic scale — C4 to C6, always consonant
  const NOTES = [
    261.63, 293.66, 329.63, 392.00, 440.00, // C4 D4 E4 G4 A4
    523.25, 587.33, 659.25, 783.99, 880.00, // C5 D5 E5 G5 A5
    1046.50, 1174.66                          // C6 D6
  ];

  function initCtx() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }

  function playNote(freq, volume = 0.04) {
    if (!ctx) return;
    const now = ctx.currentTime;

    // Oscillator — sine for softness
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    // Subtle harmonics — one octave up, very quiet
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, now);

    // Gain envelope — attack + long decay
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 3.5);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(volume * 0.2, now + 0.01);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

    // Reverb via convolver simulation — simple delay
    const delay = ctx.createDelay(0.5);
    delay.delayTime.setValueAtTime(0.18, now);
    const delayGain = ctx.createGain();
    delayGain.gain.setValueAtTime(0.15, now);

    // Connect
    osc.connect(gain);
    osc2.connect(gain2);
    gain.connect(ctx.destination);
    gain2.connect(ctx.destination);
    gain.connect(delay);
    delay.connect(delayGain);
    delayGain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 4);
    osc2.start(now);
    osc2.stop(now + 3);
  }

  function trigger() {
    const now = Date.now();
    if (now - lastPlayed < MIN_INTERVAL) return;
    lastPlayed = now;

    initCtx();
    if (ctx.state === 'suspended') ctx.resume();

    // Pick a random note, occasionally drop an octave for depth
    const pool = Math.random() < 0.2
      ? NOTES.slice(0, 5)   // lower register occasionally
      : NOTES.slice(3, 10); // mid register mostly

    const freq = pool[Math.floor(Math.random() * pool.length)];
    const vol = 0.025 + Math.random() * 0.025; // vary volume slightly
    playNote(freq, vol);
  }

  // Elements that trigger notes
  const SELECTORS = [
    'a',
    '.post-item',
    '.post-title',
    'h1',
    'h2',
    '.post-body p',
    '.nav-btn',
    '.btn',
  ];

  function attach() {
    SELECTORS.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        el.addEventListener('mouseenter', trigger, { passive: true });
      });
    });

    // Also trigger occasionally on scroll — very sparse
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (Math.random() < 0.3) trigger(); // only 30% of scroll stops
      }, 400);
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attach);
  } else {
    attach();
  }
})();
