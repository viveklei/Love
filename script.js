/**
 * Aura Match - The Elegant Love Calculator
 * Core Logic, Dashboard, Passcode Gate, and localStorage Persistence
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const PASSCODE     = '425680';
const STORAGE_KEY  = 'aura_match_history';
const MAX_HISTORY  = 50;

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

/**
 * Deterministic love score: same pair of names → same result.
 */
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

// ─── LocalStorage ─────────────────────────────────────────────────────────────

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveHistory(history) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

function addRecord(nameOne, nameTwo, score, verdict) {
  const history = loadHistory();
  history.unshift({
    nameOne,
    nameTwo,
    score,
    verdict,
    timestamp: new Date().toISOString()
  });
  // Keep only most recent MAX_HISTORY entries
  if (history.length > MAX_HISTORY) history.splice(MAX_HISTORY);
  saveHistory(history);
}

// ─── Panel Switching ──────────────────────────────────────────────────────────

function switchPanel(fromId, toId) {
  const fromEl = document.getElementById(fromId);
  const toEl   = document.getElementById(toId);

  fromEl.classList.remove('active');
  setTimeout(() => {
    fromEl.style.display = 'none';
    toEl.style.display   = 'block';
    toEl.offsetHeight;            // force reflow
    toEl.classList.add('active');
  }, 400);
}

// ─── Calculator Flow ──────────────────────────────────────────────────────────

function calculateLove(event) {
  event.preventDefault();

  const nameOne = document.getElementById('name-one').value.trim();
  const nameTwo = document.getElementById('name-two').value.trim();
  if (!nameOne || !nameTwo) return;

  switchPanel('input-view', 'loading-view');

  let msgIdx = 0;
  const loadingTextEl  = document.getElementById('loading-text');
  loadingTextEl.textContent = LOADING_MESSAGES[0];

  const msgInterval = setInterval(() => {
    msgIdx++;
    if (msgIdx < LOADING_MESSAGES.length) {
      loadingTextEl.textContent = LOADING_MESSAGES[msgIdx];
    }
  }, 600);

  setTimeout(() => {
    clearInterval(msgInterval);
    const score   = getDeterministicLoveScore(nameOne, nameTwo);
    const verdict = getVerdict(score);

    // Persist to localStorage
    addRecord(nameOne, nameTwo, score, verdict.title);

    displayResults(nameOne, nameTwo, score, verdict);
    switchPanel('loading-view', 'result-view');
  }, LOADING_MESSAGES.length * 600);
}

function displayResults(nameOne, nameTwo, score, verdict) {
  document.getElementById('res-name-one').textContent = nameOne;
  document.getElementById('res-name-two').textContent = nameTwo;
  document.getElementById('verdict-title').textContent = verdict.title;
  document.getElementById('verdict-desc').textContent  = verdict.desc;

  const circumference  = 2 * Math.PI * 50; // 314.16
  const progressCircle = document.getElementById('gauge-progress');
  const percentageEl   = document.getElementById('percentage-val');

  progressCircle.style.strokeDashoffset = circumference;
  percentageEl.textContent = '0%';

  const duration   = 1500;
  const totalFrames = (duration / 1000) * 60;
  let frame = 0;

  const tick = setInterval(() => {
    frame++;
    const eased  = 1 - Math.pow(1 - frame / totalFrames, 3);
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

  // determine the currently active panel to switch from
  const panels = ['result-view', 'dashboard-view', 'loading-view'];
  const active  = panels.find(id => document.getElementById(id).classList.contains('active'));
  switchPanel(active || 'result-view', 'input-view');
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function showDashboard() {
  renderDashboard();

  // Find currently active panel
  const panels  = ['input-view', 'result-view', 'loading-view'];
  const current = panels.find(id => document.getElementById(id).classList.contains('active')) || 'input-view';
  switchPanel(current, 'dashboard-view');
}

function renderDashboard() {
  const history  = loadHistory();
  const totalEl  = document.getElementById('stat-total');
  const avgEl    = document.getElementById('stat-avg');
  const bodyEl   = document.getElementById('history-body');

  // Stats
  totalEl.textContent = history.length;

  if (history.length > 0) {
    const avg = Math.round(history.reduce((sum, r) => sum + r.score, 0) / history.length);
    avgEl.textContent = `${avg}%`;
  } else {
    avgEl.textContent = '—';
  }

  // Table rows
  if (history.length === 0) {
    bodyEl.innerHTML = `
      <tr>
        <td colspan="3">
          <div class="empty-state">
            <span class="empty-state-icon">💫</span>
            No matches recorded yet. Run your first calculation!
          </div>
        </td>
      </tr>`;
    return;
  }

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
        <td>
          <span class="affinity-badge ${badgeClass}">${record.score}%</span>
        </td>
        <td>
          <span class="verdict-chip">${escapeHtml(record.verdict)}</span>
        </td>
      </tr>`;
  }).join('');
}

function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
  renderDashboard();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
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
  // Close only if clicking the backdrop (not the card itself)
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

  if (pinBuffer.length === 6) {
    // Small delay so the last dot fills before checking
    setTimeout(checkPasscode, 150);
  }
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
    // Correct — open dashboard
    _dismissModal();
    showDashboard();
  } else {
    // Wrong — shake and show error
    const display = document.getElementById('pin-display');
    const dots    = display.querySelectorAll('.pin-dot');
    dots.forEach(d => { d.classList.remove('filled'); d.classList.add('error'); });
    display.classList.add('shake');
    document.getElementById('pin-error').textContent = 'Incorrect passcode';

    setTimeout(() => {
      display.classList.remove('shake');
      pinBuffer = '';
      updatePinDots();
    }, 450);
  }
}

// Keyboard support for PIN modal
document.addEventListener('keydown', (e) => {
  const overlay = document.getElementById('passcode-overlay');
  if (!overlay.classList.contains('open')) return;

  if (e.key >= '0' && e.key <= '9') { pinPress(e.key); }
  else if (e.key === 'Backspace')    { pinDelete(); }
  else if (e.key === 'Escape')       { _dismissModal(); }
});
