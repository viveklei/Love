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
