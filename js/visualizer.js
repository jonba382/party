// ── Countdown & Clock ─────────────────────────────────────────────────────
function updateCountdown() {
  const target = new Date('2026-09-19T18:00:00');
  const now = new Date();
  const diff = target - now;
  if (diff <= 0) {
    ['days','hours','minutes','seconds'].forEach(id => document.getElementById(id).textContent = '00');
    return;
  }
  document.getElementById('days').textContent    = String(Math.floor(diff / 86400000)).padStart(2,'0');
  document.getElementById('hours').textContent   = String(Math.floor((diff % 86400000) / 3600000)).padStart(2,'0');
  document.getElementById('minutes').textContent = String(Math.floor((diff % 3600000) / 60000)).padStart(2,'0');
  document.getElementById('seconds').textContent = String(Math.floor((diff % 60000) / 1000)).padStart(2,'0');
}

function updateClock() {
  const now = new Date();
  document.getElementById('tbclock').textContent =
    String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
}

updateCountdown();
updateClock();
setInterval(updateCountdown, 1000);
setInterval(updateClock, 10000);

// ── Winamp visualizer ─────────────────────────────────────────────────────
const canvas = document.getElementById('visualizer');
const ctx2 = canvas.getContext('2d');
let demoMode = true;

function resizeCanvas() { canvas.width = canvas.offsetWidth; }
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ── Techno sequencer ──────────────────────────────────────────────────────
const BPM  = 132;
const spb  = 60 / BPM;
const sp16 = spb / 4;

let kickE = 0, bassE = 0, hatE = 0, claveE = 0, synthE = 0;
let phase16 = 0, fracT = 0, lastTS = null;
let totalBeats = 0;

const kickGrid  = new Set([0, 4, 8, 12]);
const hatGrid   = new Set([2, 6, 10, 14]);
const claveGrid = new Set([3, 7, 11]);
const bassGrid  = new Set([0, 2, 3, 4, 6, 8, 10, 11, 12, 14]);

function drawDemo(timestamp) {
  if (!demoMode) return;
  if (!lastTS) lastTS = timestamp;
  const dt = Math.min((timestamp - lastTS) / 1000, 0.05);
  lastTS = timestamp;

  fracT += dt / sp16;
  while (fracT >= 1) {
    fracT -= 1;
    phase16 = (phase16 + 1) % 16;
    totalBeats++;
    if (kickGrid.has(phase16))  kickE  = 1.0;
    if (hatGrid.has(phase16))   hatE   = 0.7;
    if (claveGrid.has(phase16)) claveE = 0.55;
    if (bassGrid.has(phase16))  bassE  = Math.min(1.0, bassE + 0.85);
  }

  kickE  *= Math.pow(0.001, dt / 0.06);
  bassE  *= Math.pow(0.001, dt / 0.22);
  hatE   *= Math.pow(0.001, dt / 0.04);
  claveE *= Math.pow(0.001, dt / 0.09);
  synthE *= Math.pow(0.001, dt / 0.38);

  resizeCanvas();
  const W = canvas.width, H = canvas.height;
  const mid = Math.floor(H / 2);

  const bands = [
    Math.min(1, kickE * 0.95 + bassE * 0.1),
    Math.min(1, bassE * 0.85 + kickE * 0.2),
    Math.min(1, claveE * 0.7 + bassE * 0.25 + synthE * 0.15),
    Math.min(1, synthE * 0.7 + claveE * 0.3),
    Math.min(1, hatE * 0.8 + synthE * 0.2 + 0.02),
  ];

  ctx2.fillStyle = '#000a14';
  ctx2.fillRect(0, 0, W, H);

  const BAR_W = 3, GAP = 2, STEP = BAR_W + GAP;
  const numBars = Math.floor(W / STEP);
  const particles = [];

  for (let i = 0; i < numBars; i++) {
    const norm = i / numBars;
    const bandPos = norm * (bands.length - 1);
    const b0 = Math.floor(bandPos), b1 = Math.min(bands.length - 1, b0 + 1);
    const bf = bandPos - b0;
    let energy = bands[b0] * (1 - bf) + bands[b1] * bf;
    energy += Math.sin(norm * Math.PI * numBars * 0.3 + fracT * 12) * 0.06;
    energy += Math.random() * 0.025;
    energy = Math.min(1, Math.max(0, energy));

    const barH = Math.max(2, Math.round(energy * (mid - 3)));
    const x = i * STEP;

    let r, g, b;
    if (energy < 0.45) {
      const t2 = energy / 0.45;
      r = 0; g = Math.round(80 + t2 * 120); b = Math.round(140 + t2 * 80);
    } else if (energy < 0.78) {
      const t2 = (energy - 0.45) / 0.33;
      r = Math.round(t2 * 40); g = Math.round(200 + t2 * 55); b = 220;
    } else {
      const t2 = (energy - 0.78) / 0.22;
      r = Math.round(40 + t2 * 215); g = 255; b = Math.round(220 + t2 * 35);
    }
    const col = `rgb(${r},${g},${b})`;

    ctx2.fillStyle = col;
    ctx2.fillRect(x, mid - barH, BAR_W, barH);
    ctx2.fillStyle = `rgba(${r},${g},${b},0.55)`;
    ctx2.fillRect(x, mid, BAR_W, barH);

    if (energy > 0.55) {
      ctx2.fillStyle = `rgba(${r},${g},${b},0.9)`;
      ctx2.fillRect(x, mid - barH - 1, BAR_W, 2);
    }
    if (energy > 0.82 && Math.random() < 0.35) {
      particles.push({ x: x + 1, y: mid - barH - 2 });
    }
  }

  const grad = ctx2.createLinearGradient(0, mid - 1, 0, mid + 2);
  grad.addColorStop(0, 'rgba(0,220,255,0.0)');
  grad.addColorStop(0.5, `rgba(0,220,255,${0.25 + kickE * 0.55})`);
  grad.addColorStop(1, 'rgba(0,220,255,0.0)');
  ctx2.fillStyle = grad;
  ctx2.fillRect(0, mid - 1, W, 3);

  for (const p of particles) {
    ctx2.fillStyle = `rgba(180,240,255,${0.5 + Math.random() * 0.5})`;
    ctx2.fillRect(p.x + Math.round((Math.random()-0.5)*6), p.y - Math.round(Math.random()*4), 1, 1);
  }

  requestAnimationFrame(drawDemo);
}
requestAnimationFrame(drawDemo);

// ── Web Audio Engine ──────────────────────────────────────────────────────
let beatAudioCtx = null;
let beatScheduled = false;

const D3=146.8, F3=174.6, G3=196.0, A3=220.0, C4=261.6, D4=293.7, A2=110.0, F4=349.2;

const melodyPhrase = [
  D3,  null, null, F3,   G3,  null, A3,  null,
  C4,  null, A3,   null, G3,  F3,   null, D3,
  null, A2,  null, D3,   F3,  null, G3,  null,
  A3,  C4,   null, A3,   D4,  null, F3,  null
];
const melodyPhrase2 = [
  G3,  null, null, A3,   C4,  null, D4,  null,
  F4,  null, D4,   null, C4,  A3,   null, G3,
  null, D3,  null, F3,   G3,  null, A3,  C4,
  D4,  null, C4,   A3,   G3,  null, A3,  null
];

function startBeat() {
  if (beatScheduled) return;
  beatScheduled = true;
  beatAudioCtx = new (window.AudioContext || window.webkitAudioContext)();

  const masterGain = beatAudioCtx.createGain();
  masterGain.gain.value = 0.13;
  masterGain.connect(beatAudioCtx.destination);

  const lpf = beatAudioCtx.createBiquadFilter();
  lpf.type = 'lowpass'; lpf.frequency.value = 7000;
  lpf.connect(masterGain);

  const synthGain = beatAudioCtx.createGain();
  synthGain.gain.value = 0.18;
  synthGain.connect(masterGain);

  function playKick(t) {
    const osc = beatAudioCtx.createOscillator();
    const g = beatAudioCtx.createGain();
    osc.connect(g); g.connect(lpf);
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    g.gain.setValueAtTime(1.0, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.start(t); osc.stop(t + 0.36);
  }

  function playHat(t, open) {
    const len = open ? 0.12 : 0.035;
    const buf = beatAudioCtx.createBuffer(1, Math.ceil(beatAudioCtx.sampleRate * len), beatAudioCtx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = beatAudioCtx.createBufferSource(); src.buffer = buf;
    const hpf = beatAudioCtx.createBiquadFilter();
    hpf.type = 'highpass'; hpf.frequency.value = open ? 7000 : 9500;
    const g = beatAudioCtx.createGain();
    src.connect(hpf); hpf.connect(g); g.connect(lpf);
    g.gain.setValueAtTime(open ? 0.30 : 0.16, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + len);
    src.start(t); src.stop(t + len + 0.01);
  }

  function playBass(t, freq) {
    const osc = beatAudioCtx.createOscillator();
    osc.type = 'sawtooth';
    const filt = beatAudioCtx.createBiquadFilter();
    filt.type = 'lowpass'; filt.frequency.value = 380; filt.Q.value = 4;
    const g = beatAudioCtx.createGain();
    osc.connect(filt); filt.connect(g); g.connect(lpf);
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.55, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + sp16 * 0.82);
    osc.start(t); osc.stop(t + sp16 * 0.85);
  }

  function playSynth(t, freq) {
    if (!freq) return;
    const osc1 = beatAudioCtx.createOscillator();
    const osc2 = beatAudioCtx.createOscillator();
    osc1.type = 'sine'; osc2.type = 'sine';
    osc1.frequency.value = freq;
    osc2.frequency.value = freq * 1.005;
    const g = beatAudioCtx.createGain();
    osc1.connect(g); osc2.connect(g); g.connect(synthGain);
    const dur = sp16 * 3.2;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.6, t + 0.04);
    g.gain.setValueAtTime(0.6, t + sp16 * 2);
    g.gain.linearRampToValueAtTime(0, t + dur);
    osc1.start(t); osc1.stop(t + dur + 0.05);
    osc2.start(t); osc2.stop(t + dur + 0.05);
    synthE = 0.9;
  }

  const bassFreqs = [73.42,82.41,87.31,98.00,110.00,87.31,98.00,82.41,
                     73.42,82.41,87.31,98.00,110.00,87.31,98.00,110.00];
  let barCount = 0, melodyStep = 0;

  function scheduleBar(startTime) {
    const usePhrase2 = (barCount >= 8);
    for (let step = 0; step < 16; step++) {
      const t = startTime + step * sp16;
      if (kickGrid.has(step))  playKick(t);
      if (hatGrid.has(step))   playHat(t, true);
      if (step % 2 === 0 && !kickGrid.has(step)) playHat(t, false);
      if (bassGrid.has(step))  playBass(t, bassFreqs[step]);
      if (step % 2 === 0) {
        const phrase = usePhrase2 ? melodyPhrase2 : melodyPhrase;
        playSynth(t, phrase[melodyStep % 32]);
        melodyStep++;
      }
    }
    barCount++;
  }

  const fadeStartBar = 29;
  const fadeDuration = spb * 4 * 4;
  let nextBarTime = beatAudioCtx.currentTime + 0.1;
  scheduleBar(nextBarTime);
  nextBarTime += spb * 4;

  const schedInterval = setInterval(() => {
    if (beatAudioCtx.state === 'suspended') return;
    if (barCount > 33) { clearInterval(schedInterval); return; }
    scheduleBar(nextBarTime);
    if (barCount === fadeStartBar) {
      masterGain.gain.setValueAtTime(0.13, nextBarTime);
      masterGain.gain.linearRampToValueAtTime(0, nextBarTime + fadeDuration);
    }
    nextBarTime += spb * 4;
  }, spb * 4 * 1000 * 0.75);
}

document.addEventListener('click',   () => { startBeat(); }, { once: false });
document.addEventListener('keydown', () => { startBeat(); }, { once: true  });
