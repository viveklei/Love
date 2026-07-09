/**
 * Aura Match — The Elegant Love Calculator
 * Global data storage via Firebase Firestore
 */

// ─── Firebase Setup ───────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey:            "AIzaSyB3AtA7D-hmKF2PMc3UsWiAKJmw6kx0fXw",
  authDomain:        "love-calculator-1bde2.firebaseapp.com",
  projectId:         "love-calculator-1bde2",
  storageBucket:     "love-calculator-1bde2.firebasestorage.app",
  messagingSenderId: "626832013829",
  appId:             "1:626832013829:web:f8a1222e03996bfdb87a6c",
  measurementId:     "G-G3PEWPER5Y"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const COLLECTION = 'matches';

// ─── Constants ────────────────────────────────────────────────────────────────

const PASSCODE = '425680';

const LOADING_MESSAGES = [
  "Aligning heartbeats...",
  "Calibrating cosmic affinity...",
  "Reading aura frequencies...",
  "Synthesizing celestial compatibility...",
  "Finalizing match results..."
];

const VERDICTS = [
  {
    min: 0,  max: 25,
    title: "Distant Stars",
    desc:  "Your paths are unique and run parallel. While the current resonance is faint, the universe is full of unexpected orbits."
  },
  {
    min: 26, max: 50,
    title: "Quiet Echoes",
    desc:  "A gentle connection exists, but it requires patience and nurturing. With time, minor ripples could build a deeper rhythm."
  },
  {
    min: 51, max: 75,
    title: "Harmonic Glow",
    desc:  "A warm and promising connection. You share a natural cadence, and your individual frequencies complement each other well."
  },
  {
    min: 76, max: 90,
    title: "Soul Resonance",
    desc:  "High vibrational compatibility! Your minds and hearts share a powerful synchronization. A truly beautiful bond."
  },
  {
    min: 91, max: 100,
    title: "Celestial Unity",
    desc:  "An extraordinary, cosmic connection. Your energies flow in absolute harmony — destined to create magic together."
  }
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDeterministicLoveScore(name1, name2) {
  const sortedNames = [name1.trim().toLowerCase(), name2.trim().toLowerCase()].sort().join('&');
  let hash = 0;
  for (let i = 0; i < sortedNames.length; i++) {
    hash = (hash << 5) - hash + sortedNames.charCodeAt(i);
    hash |= 0;
  }
  return Math.min(Math.max(Math.abs(hash % 71) + 30, 0), 100);
}

function getVerdict(score) {
  return VERDICTS.find(v => score >= v.min && score <= v.max) || VERDICTS[VERDICTS.length - 1];
}

function getAffinityClass(score) {
  if (score <= 25) return 'affinity-low';
  if (score <= 50) return 'affinity-medium';
  if (score <= 80) return 'affinity-high';
  return 'affinity-max';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ─── Firestore: Save a match ──────────────────────────────────────────────────

async function addRecord(nameOne, nameTwo, score, verdict) {
  try {
    await db.collection(COLLECTION).add({
      nameOne,
      nameTwo,
      score,
      verdict,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (err) {
    console.error('Firestore write error:', err);
  }
}

// ─── Firestore: Fetch all matches ─────────────────────────────────────────────

async function fetchHistory() {
  try {
    const snapshot = await db.collection(COLLECTION)
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id:        doc.id,
        nameOne:   data.nameOne   || '',
        nameTwo:   data.nameTwo   || '',
        score:     data.score     || 0,
        verdict:   data.verdict   || '',
        timestamp: data.timestamp ? data.timestamp.toDate().toISOString() : new Date().toISOString()
      };
    });
  } catch (err) {
    console.error('Firestore read error:', err);
    return [];
  }
}

// ─── Firestore: Clear all matches ─────────────────────────────────────────────

async function deleteAllRecords() {
  try {
    const snapshot = await db.collection(COLLECTION).get();
    const batch    = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  } catch (err) {
    console.error('Firestore delete error:', err);
  }
}

// ─── Panel Switching ──────────────────────────────────────────────────────────

function switchPanel(fromId, toId) {
  const fromEl = document.getElementById(fromId);
  const toEl   = document.getElementById(toId);
  fromEl.classList.remove('active');
  setTimeout(() => {
    fromEl.style.display = 'none';
    toEl.style.display   = 'block';
    toEl.offsetHeight;
    toEl.classList.add('active');
  }, 400);
}

function getActivePanel() {
  const panels = ['input-view', 'result-view', 'loading-view', 'dashboard-view'];
  return panels.find(id => document.getElementById(id).classList.contains('active')) || 'input-view';
}

// ─── Calculator Flow ──────────────────────────────────────────────────────────

function calculateLove(event) {
  event.preventDefault();

  const nameOne = document.getElementById('name-one').value.trim();
  const nameTwo = document.getElementById('name-two').value.trim();
  if (!nameOne || !nameTwo) return;

  switchPanel('input-view', 'loading-view');

  let msgIdx = 0;
  const loadingTextEl = document.getElementById('loading-text');
  loadingTextEl.textContent = LOADING_MESSAGES[0];

  const msgInterval = setInterval(() => {
    msgIdx++;
    if (msgIdx < LOADING_MESSAGES.length) {
      loadingTextEl.textContent = LOADING_MESSAGES[msgIdx];
    }
  }, 600);

  setTimeout(async () => {
    clearInterval(msgInterval);
    const score   = getDeterministicLoveScore(nameOne, nameTwo);
    const verdict = getVerdict(score);

    // Save to Firestore (global)
    await addRecord(nameOne, nameTwo, score, verdict.title);

    displayResults(nameOne, nameTwo, score, verdict);
    switchPanel('loading-view', 'result-view');
  }, LOADING_MESSAGES.length * 600);
}

function displayResults(nameOne, nameTwo, score, verdict) {
  document.getElementById('res-name-one').textContent = nameOne;
  document.getElementById('res-name-two').textContent = nameTwo;
  document.getElementById('verdict-title').textContent = verdict.title;
  document.getElementById('verdict-desc').textContent  = verdict.desc;

  const circumference  = 2 * Math.PI * 50;
  const progressCircle = document.getElementById('gauge-progress');
  const percentageEl   = document.getElementById('percentage-val');

  progressCircle.style.strokeDashoffset = circumference;
  percentageEl.textContent = '0%';

  const totalFrames = (1500 / 1000) * 60;
  let frame = 0;

  const tick = setInterval(() => {
    frame++;
    const eased   = 1 - Math.pow(1 - frame / totalFrames, 3);
    const current = Math.round(eased * score);
    percentageEl.textContent = `${current}%`;
    progressCircle.style.strokeDashoffset = circumference - (eased * score / 100) * circumference;

    if (frame >= totalFrames) {
      clearInterval(tick);
      percentageEl.textContent = `${score}%`;
      progressCircle.style.strokeDashoffset = circumference - (score / 100) * circumference;
    }
  }, 1000 / 60);
}

function resetCalculator() {
  document.getElementById('name-one').value = '';
  document.getElementById('name-two').value = '';
  switchPanel(getActivePanel(), 'input-view');
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function showDashboard() {
  const current = getActivePanel();
  switchPanel(current, 'dashboard-view');
  renderDashboard();
}

async function renderDashboard() {
  const totalEl  = document.getElementById('stat-total');
  const avgEl    = document.getElementById('stat-avg');
  const bodyEl   = document.getElementById('history-body');
  const loadEl   = document.getElementById('db-loading');

  // Show loading state
  bodyEl.innerHTML = '';
  loadEl.style.display = 'flex';
  totalEl.textContent  = '...';
  avgEl.textContent    = '...';

  const history = await fetchHistory();

  loadEl.style.display = 'none';

  // Stats
  totalEl.textContent = history.length;
  if (history.length > 0) {
    const avg = Math.round(history.reduce((sum, r) => sum + r.score, 0) / history.length);
    avgEl.textContent = `${avg}%`;
  } else {
    avgEl.textContent = '—';
  }

  // Empty state
  if (history.length === 0) {
    bodyEl.innerHTML = `
      <tr><td colspan="3">
        <div class="empty-state">
          <span class="empty-state-icon">💫</span>
          No matches recorded yet. Run the first calculation!
        </div>
      </td></tr>`;
    return;
  }

  // Render rows
  bodyEl.innerHTML = history.map(record => {
    const badgeClass = getAffinityClass(record.score);
    const date       = new Date(record.timestamp).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    return `
      <tr>
        <td>
          <strong>${escapeHtml(record.nameOne)}</strong>
          <span style="color:var(--text-muted);margin:0 6px">&amp;</span>
          <strong>${escapeHtml(record.nameTwo)}</strong>
          <br>
          <span style="font-size:0.72rem;color:var(--text-muted)">${date}</span>
        </td>
        <td><span class="affinity-badge ${badgeClass}">${record.score}%</span></td>
        <td><span class="verdict-chip">${escapeHtml(record.verdict)}</span></td>
      </tr>`;
  }).join('');
}

async function clearHistory() {
  const btn = document.querySelector('.btn-clear span');
  btn.textContent = 'Clearing...';
  await deleteAllRecords();
  btn.textContent = 'Clear History';
  renderDashboard();
}

// ─── Passcode Modal ───────────────────────────────────────────────────────────

let pinBuffer = '';

function openPasscodeModal() {
  pinBuffer = '';
  updatePinDots();
  document.getElementById('pin-error').textContent = '';
  document.getElementById('passcode-overlay').classList.add('open');
}

function closePasscodeModal(e) {
  if (e && e.target !== document.getElementById('passcode-overlay')) return;
  _dismissModal();
}

function _dismissModal() {
  document.getElementById('passcode-overlay').classList.remove('open');
  pinBuffer = '';
  updatePinDots();
  document.getElementById('pin-error').textContent = '';
}

function pinPress(digit) {
  if (pinBuffer.length >= 6) return;
  pinBuffer += digit;
  updatePinDots();
  if (pinBuffer.length === 6) setTimeout(checkPasscode, 150);
}

function pinDelete() {
  if (pinBuffer.length === 0) return;
  pinBuffer = pinBuffer.slice(0, -1);
  updatePinDots();
}

function pinClear() {
  pinBuffer = '';
  updatePinDots();
  document.getElementById('pin-error').textContent = '';
}

function updatePinDots() {
  for (let i = 0; i < 6; i++) {
    const dot = document.getElementById(`d${i}`);
    dot.classList.toggle('filled', i < pinBuffer.length);
    dot.classList.remove('error');
  }
}

function checkPasscode() {
  if (pinBuffer === PASSCODE) {
    _dismissModal();
    showDashboard();
  } else {
    const display = document.getElementById('pin-display');
    display.querySelectorAll('.pin-dot').forEach(d => {
      d.classList.remove('filled');
      d.classList.add('error');
    });
    display.classList.add('shake');
    document.getElementById('pin-error').textContent = 'Incorrect passcode';
    setTimeout(() => {
      display.classList.remove('shake');
      pinBuffer = '';
      updatePinDots();
    }, 450);
  }
}

// Keyboard support
document.addEventListener('keydown', (e) => {
  const overlay = document.getElementById('passcode-overlay');
  if (!overlay.classList.contains('open')) return;
  if (e.key >= '0' && e.key <= '9') pinPress(e.key);
  else if (e.key === 'Backspace')    pinDelete();
  else if (e.key === 'Escape')       _dismissModal();
});

// ─── Verdict Icons ────────────────────────────────────────────────────────────

const VERDICT_ICONS = {
  'Distant Stars':   '⭐',
  'Quiet Echoes':    '🌙',
  'Harmonic Glow':   '🌸',
  'Soul Resonance':  '💖',
  'Celestial Unity': '✨'
};

// ─── Particle Canvas System ───────────────────────────────────────────────────

const canvas  = document.getElementById('particle-canvas');
const ctx     = canvas.getContext('2d');
let particles = [];

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function randomBetween(a, b) { return a + Math.random() * (b - a); }

class Particle {
  constructor() { this.reset(true); }

  reset(initial = false) {
    this.x      = randomBetween(0, canvas.width);
    this.y      = initial ? randomBetween(0, canvas.height) : canvas.height + 20;
    this.size   = randomBetween(8, 20);
    this.speedY = randomBetween(0.3, 1.1);
    this.speedX = randomBetween(-0.3, 0.3);
    this.opacity= randomBetween(0.05, 0.25);
    this.angle  = randomBetween(0, Math.PI * 2);
    this.spin   = randomBetween(-0.02, 0.02);
    this.hue    = Math.random() > 0.5 ? '#ff3366' : '#c084fc';
  }

  update() {
    this.y     -= this.speedY;
    this.x     += this.speedX;
    this.angle += this.spin;
    if (this.y < -30) this.reset();
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.fillStyle = this.hue;
    // Draw mini heart
    const s = this.size * 0.04;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-this.size/2, -this.size/3,  -this.size, this.size/4,   0, this.size * 0.75);
    ctx.bezierCurveTo( this.size,   this.size/4,    this.size/2, -this.size/3, 0, 0);
    ctx.fill();
    ctx.restore();
  }
}

// Create initial particles
for (let i = 0; i < 40; i++) particles.push(new Particle());

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => { p.update(); p.draw(); });
  requestAnimationFrame(animateParticles);
}

animateParticles();

// ─── Celebration Burst ────────────────────────────────────────────────────────

function triggerBurst(score) {
  const container = document.getElementById('burst-container');
  container.innerHTML = '';

  const count   = score >= 80 ? 40 : score >= 50 ? 24 : 14;
  const emojis  = score >= 80 ? ['💖','✨','💫','🌸','💕'] : ['💛','⭐','🌟','✨'];
  const centerX = window.innerWidth  / 2;
  const centerY = window.innerHeight / 2;

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];

    const angle   = (i / count) * Math.PI * 2 + randomBetween(-0.3, 0.3);
    const dist    = randomBetween(80, 250);
    const dx      = Math.cos(angle) * dist;
    const dy      = Math.sin(angle) * dist;
    const size    = randomBetween(16, 32);
    const delay   = randomBetween(0, 200);

    Object.assign(el.style, {
      position:     'absolute',
      left:         centerX + 'px',
      top:          centerY + 'px',
      fontSize:     size + 'px',
      opacity:      '0',
      transform:    'translate(-50%,-50%) scale(0)',
      transition:   `all 0.7s cubic-bezier(.34,1.56,.64,1) ${delay}ms`,
      pointerEvents:'none',
      userSelect:   'none',
      zIndex:       9999
    });

    container.appendChild(el);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.opacity   = '1';
        el.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1) rotate(${randomBetween(-30,30)}deg)`;
      });
    });

    setTimeout(() => {
      el.style.transition = 'all 0.5s ease';
      el.style.opacity    = '0';
      el.style.transform  += ' scale(0)';
      setTimeout(() => el.remove(), 600);
    }, 700 + delay + 400);
  }
}

// ─── Patch displayResults to use verdict icons & burst ────────────────────────

const _origDisplayResults = displayResults;

// Override displayResults to add icon + burst
window.displayResults = function(nameOne, nameTwo, score, verdict) {
  // Update verdict icon
  const iconEl = document.getElementById('verdict-icon');
  if (iconEl) iconEl.textContent = VERDICT_ICONS[verdict.title] || '💫';

  // Original gauge + counter logic
  document.getElementById('res-name-one').textContent  = nameOne;
  document.getElementById('res-name-two').textContent  = nameTwo;
  document.getElementById('verdict-title').textContent = verdict.title;
  document.getElementById('verdict-desc').textContent  = verdict.desc;

  const circumference  = 2 * Math.PI * 50;
  const progressCircle = document.getElementById('gauge-progress');
  const glowCircle     = document.querySelector('.gauge-fill-glow');
  const percentageEl   = document.getElementById('percentage-val');

  progressCircle.style.strokeDashoffset = circumference;
  if (glowCircle) glowCircle.style.strokeDashoffset = circumference;
  percentageEl.textContent = '0%';

  const totalFrames = (1500 / 1000) * 60;
  let frame = 0;

  const tick = setInterval(() => {
    frame++;
    const eased   = 1 - Math.pow(1 - frame / totalFrames, 3);
    const current = Math.round(eased * score);
    percentageEl.textContent = `${current}%`;

    const offset = circumference - (eased * score / 100) * circumference;
    progressCircle.style.strokeDashoffset = offset;
    if (glowCircle) glowCircle.style.strokeDashoffset = offset;

    if (frame >= totalFrames) {
      clearInterval(tick);
      percentageEl.textContent = `${score}%`;
      progressCircle.style.strokeDashoffset = circumference - (score / 100) * circumference;
      if (glowCircle) glowCircle.style.strokeDashoffset = circumference - (score / 100) * circumference;
      // Trigger celebration burst
      setTimeout(() => triggerBurst(score), 200);
    }
  }, 1000 / 60);
};

