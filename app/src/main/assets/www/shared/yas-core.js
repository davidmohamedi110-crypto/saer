/* ============================================================================
   شهرِ بازی یاس و رنگ • موتور یکپارچه صدا، افکت، امتیاز، باغ یاس و پل اندروید
   ============================================================================ */
(function (global) {
  const PROG_KEY = 'yasVaRangProgress';
  const PREF_KEY = 'yasVaRangShellPrefs';
  const SOUND_KEY = 'yasVaRangSound';

  let audioCtx = null;
  let soundOn = true;
  try {
    const savedSound = localStorage.getItem(SOUND_KEY);
    if (savedSound === 'off') soundOn = false;
  } catch (e) {}

  function isAndroid() {
    return !!(global.AndroidBridge && typeof global.AndroidBridge.isAndroidApp === 'function');
  }

  function haptic(ms = 22) {
    try {
      if (global.AndroidBridge && global.AndroidBridge.vibrate) {
        global.AndroidBridge.vibrate(ms);
      } else if (navigator.vibrate) {
        navigator.vibrate(ms);
      }
    } catch (e) {}
  }

  // ---------------- Harmonic Soft Audio Engine ----------------
  function getAudio() {
    if (!audioCtx) {
      const AC = global.AudioContext || global.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function playTone(freq = 587, dur = 0.16, type = 'sine', vol = 0.15) {
    if (!soundOn) return;
    try {
      const ctx = getAudio();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = type;
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq * 2, now);

      const g2 = ctx.createGain();
      g2.gain.value = 0.22;

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      osc1.connect(gain);
      osc2.connect(g2);
      g2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + dur + 0.02);
      osc2.stop(now + dur + 0.02);
    } catch (e) {}
  }

  const AudioFX = {
    isOn: () => soundOn,
    toggle() {
      soundOn = !soundOn;
      try { localStorage.setItem(SOUND_KEY, soundOn ? 'on' : 'off'); } catch (e) {}
      if (soundOn) this.pop();
      document.querySelectorAll('[data-sound-btn]').forEach(b => {
        b.textContent = soundOn ? '🔊' : '🔇';
      });
      return soundOn;
    },
    note: playTone,
    pop() { playTone(520 + Math.random() * 240, 0.09, 'triangle', 0.14); },
    bubble() {
      if (!soundOn) return;
      try {
        const ctx = getAudio(); if (!ctx) return;
        const now = ctx.currentTime;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        const base = 360 + Math.random() * 220;
        o.frequency.setValueAtTime(base, now);
        o.frequency.exponentialRampToValueAtTime(base * 2.1, now + 0.11);
        g.gain.setValueAtTime(0.14, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        o.connect(g); g.connect(ctx.destination);
        o.start(now); o.stop(now + 0.13);
      } catch (e) {}
    },
    sparkle() {
      [784, 988, 1175, 1568].forEach((f, i) => setTimeout(() => playTone(f, 0.14, 'sine', 0.11), i * 52));
    },
    blessing() {
      [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568].forEach((f, i) =>
        setTimeout(() => playTone(f, 0.28, 'sine', 0.12), i * 65)
      );
    },
    fanfare() {
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) =>
        setTimeout(() => playTone(f, 0.24, 'triangle', 0.16), i * 85)
      );
    },
    meow() {
      if (!soundOn) return;
      try {
        const ctx = getAudio(); if (!ctx) return;
        const now = ctx.currentTime;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(640, now);
        o.frequency.linearRampToValueAtTime(920, now + 0.12);
        o.frequency.exponentialRampToValueAtTime(490, now + 0.38);
        g.gain.setValueAtTime(0.001, now);
        g.gain.linearRampToValueAtTime(0.17, now + 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        o.connect(g); g.connect(ctx.destination);
        o.start(now); o.stop(now + 0.42);
      } catch (e) {}
    },
    purr() {
      if (!soundOn) return;
      [110, 130, 115, 135].forEach((f, i) => setTimeout(() => playTone(f, 0.12, 'sine', 0.08), i * 95));
    },
    lullaby() {
      const melody = [523, 659, 784, 659, 698, 587, 523];
      melody.forEach((f, i) => setTimeout(() => playTone(f, 0.42, 'sine', 0.11), i * 380));
    }
  };

  // ---------------- Celebration Particle Engine ----------------
  let fxCanvas = null, fxCtx = null, particles = [], fxLooping = false;

  function ensureFxCanvas() {
    if (fxCanvas) return;
    fxCanvas = document.getElementById('yasFxCanvas');
    if (!fxCanvas) {
      fxCanvas = document.createElement('canvas');
      fxCanvas.id = 'yasFxCanvas';
      document.body.appendChild(fxCanvas);
    }
    fxCtx = fxCanvas.getContext('2d');
    const resize = () => {
      fxCanvas.width = global.innerWidth;
      fxCanvas.height = global.innerHeight;
    };
    resize();
    global.addEventListener('resize', resize);
    if (!fxLooping) {
      fxLooping = true;
      requestAnimationFrame(tickFx);
    }
  }

  function tickFx() {
    if (fxCtx) {
      fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.g;
        p.rot += p.vr;
        p.alpha -= p.decay;
        if (p.alpha <= 0) { particles.splice(i, 1); continue; }
        fxCtx.save();
        fxCtx.globalAlpha = p.alpha;
        fxCtx.translate(p.x, p.y);
        fxCtx.rotate((p.rot * Math.PI) / 180);
        if (p.emoji) {
          fxCtx.font = `${p.size * 2.2}px sans-serif`;
          fxCtx.textAlign = 'center';
          fxCtx.textBaseline = 'middle';
          fxCtx.fillText(p.emoji, 0, 0);
        } else {
          fxCtx.fillStyle = p.color;
          fxCtx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.65);
        }
        fxCtx.restore();
      }
    }
    requestAnimationFrame(tickFx);
  }

  function burst(x, y, count = 36, emojis = null) {
    ensureFxCanvas();
    const cols = ['#ff4fa3', '#fbbf24', '#34d399', '#38bdf8', '#a855f7', '#fb7185'];
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 2.4 + Math.random() * 8;
      particles.push({
        x, y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 3.6,
        g: 0.21,
        size: 5 + Math.random() * 6,
        color: cols[Math.floor(Math.random() * cols.length)],
        emoji: emojis && i % 3 === 0 ? emojis[Math.floor(Math.random() * emojis.length)] : null,
        alpha: 1,
        decay: 0.016 + Math.random() * 0.008,
        rot: Math.random() * 360,
        vr: (Math.random() - 0.5) * 12
      });
    }
  }

  // ---------------- Shared Progress & Toast ----------------
  function getProgress() {
    try {
      const raw = JSON.parse(localStorage.getItem(PROG_KEY) || '{}');
      return { stars: Number(raw.stars) || 0, buds: Number(raw.buds) || 0 };
    } catch (e) {
      return { stars: 0, buds: 0 };
    }
  }

  function setProgress(obj) {
    const clean = { stars: Math.max(0, Number(obj.stars) || 0), buds: Math.max(0, Number(obj.buds) || 0) };
    try { localStorage.setItem(PROG_KEY, JSON.stringify(clean)); } catch (e) {}
    syncUI();
    return clean;
  }

  function addReward(stars = 0, buds = 0, toastMsg = null) {
    const p = getProgress();
    p.stars += stars;
    p.buds += buds;
    setProgress(p);
    haptic(28);
    if (toastMsg) showToast(toastMsg);
    return p;
  }

  function syncUI() {
    const p = getProgress();
    document.querySelectorAll('[data-stars]').forEach(el => el.textContent = p.stars);
    document.querySelectorAll('[data-buds]').forEach(el => el.textContent = p.buds);
    document.querySelectorAll('[data-sound-btn]').forEach(b => b.textContent = soundOn ? '🔊' : '🔇');
  }

  let toastTimer = null;
  function showToast(msg) {
    let el = document.getElementById('yasGlobalToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'yasGlobalToast';
      el.className = 'yas-toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
  }

  // ---------------- Save Image (Android Gallery OR Browser Download) ----------------
  function saveImage(dataUrl, fileName = 'yas-memory.png') {
    AudioFX.sparkle();
    haptic(35);
    if (global.AndroidBridge && typeof global.AndroidBridge.saveImageToGallery === 'function') {
      const ok = global.AndroidBridge.saveImageToGallery(dataUrl, fileName);
      if (ok) showToast('📸 عکس یادگاری در گالری گوشی ذخیره شد! 🌸');
      return;
    }
    const a = document.createElement('a');
    a.download = fileName;
    a.href = dataUrl;
    a.click();
    showToast('📸 عکس یادگاری دانلود شد! 🌸');
  }

  // ---------------- Shared Garden Modal ----------------
  function openGarden() {
    AudioFX.sparkle();
    let bg = document.getElementById('yasGardenModal');
    if (!bg) {
      bg = document.createElement('div');
      bg.id = 'yasGardenModal';
      bg.className = 'yas-modal-bg';
      bg.onclick = (e) => { if (e.target === bg) closeGarden(); };
      bg.innerHTML = `
        <div class="yas-modal-card" style="border-color:#34d399;background:linear-gradient(180deg,#fffdf9,#f0fdf4);">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
            <h2 style="margin:0;font-size:18px;font-weight:900;color:#065f46;">🌸 باغِ یاسِ خواهران</h2>
            <button class="soft-btn" onclick="YasCore.closeGarden()">✖️ بستن</button>
          </div>
          <p style="font-size:12.5px;font-weight:700;color:#475569;margin:8px 0;line-height:1.6;">
            با هر بازی، مهربانی و هنرآفرینی، ستاره ⭐ و غنچه‌ی یاس 🌸 می‌گیری و باغچه‌تون پرگل‌تر می‌شه! روی گل‌ها بزن تا موسیقی بنوازن:
          </p>
          <div id="yasGardenPlot" class="yas-garden-plot"></div>
          <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;font-weight:900;font-size:13.5px;color:#047857;">
            <span>⭐ مجموع ستاره‌ها: <span data-stars>0</span></span>
            <span>🌸 غنچه‌های یاس: <span data-buds>0</span></span>
          </div>
        </div>
      `;
      document.body.appendChild(bg);
    }
    const p = getProgress();
    const plot = bg.querySelector('#yasGardenPlot');
    plot.innerHTML = '';
    const count = Math.max(6, Math.min(36, p.buds + 5));
    const icons = ['🌸', '🌼', '🌷', '🌺', '🦋', '✨', '🌹'];
    const notes = [523, 587, 659, 784, 880, 1046];
    for (let i = 0; i < count; i++) {
      const sp = document.createElement('span');
      sp.className = 'yas-flower-item';
      sp.textContent = icons[i % icons.length];
      sp.onclick = (e) => {
        AudioFX.note(notes[i % notes.length], 0.2, 'sine', 0.16);
        haptic(15);
        burst(e.clientX, e.clientY, 14, ['🌸', '✨']);
      };
      plot.appendChild(sp);
    }
    syncUI();
    bg.classList.add('open');
  }

  function closeGarden() {
    const bg = document.getElementById('yasGardenModal');
    if (bg) bg.classList.remove('open');
  }

  function applySavedTheme() {
    try {
      const prefs = JSON.parse(localStorage.getItem(PREF_KEY) || '{}');
      if (prefs.theme) document.body.className = 'theme-' + prefs.theme;
    } catch (e) {}
  }

  function drawRoundRect(c, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + rr, y);
    c.arcTo(x + w, y, x + w, y + h, rr);
    c.arcTo(x + w, y + h, x, y + h, rr);
    c.arcTo(x, y + h, x, y, rr);
    c.arcTo(x, y, x + w, y, rr);
    c.closePath();
  }

  function initAmbientOrbs() {
    if (!document.querySelector('.yas-bg-orbs')) {
      const d = document.createElement('div');
      d.className = 'yas-bg-orbs';
      d.innerHTML = '<span></span><span></span><span></span>';
      document.body.prepend(d);
    }
  }

  global.addEventListener('DOMContentLoaded', () => {
    applySavedTheme();
    initAmbientOrbs();
    syncUI();
  });

  // Back button inside games returns cleanly to Lobby
  global.onAndroidBack = function () {
    const g = document.getElementById('yasGardenModal');
    if (g && g.classList.contains('open')) {
      closeGarden();
      return 'HANDLED';
    }
    if (location.pathname.includes('/games/')) {
      location.href = '../index.html';
      return 'HANDLED';
    }
    return 'EXIT';
  };

  global.YasCore = {
    isAndroid,
    haptic,
    audio: AudioFX,
    burst,
    getProgress,
    setProgress,
    addReward,
    syncUI,
    showToast,
    saveImage,
    openGarden,
    closeGarden,
    drawRoundRect,
    PREF_KEY
  };
})(window);
