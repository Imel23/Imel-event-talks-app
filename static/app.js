/* ── DOM refs ──────────────────────────────────────── */
const refreshBtn   = document.getElementById('refreshBtn');
const refreshIcon  = document.getElementById('refreshIcon');
const refreshLabel = document.getElementById('refreshLabel');
const exportBtn    = document.getElementById('exportBtn');
const themeToggle  = document.getElementById('themeToggle');
const iconSun      = document.getElementById('iconSun');
const iconMoon     = document.getElementById('iconMoon');
const copyToast    = document.getElementById('copyToast');
const statsBar     = document.getElementById('statsBar');
const statEntries  = document.getElementById('statEntries');
const statUpdated  = document.getElementById('statUpdated');
const errorBanner  = document.getElementById('errorBanner');
const errorMsg     = document.getElementById('errorMsg');
const skeleton     = document.getElementById('skeleton');
const feed         = document.getElementById('feed');
const emptyState   = document.getElementById('emptyState');

// Modal
const tweetModal    = document.getElementById('tweetModal');
const modalClose    = document.getElementById('modalClose');
const tweetText     = document.getElementById('tweetText');
const tweetLink     = document.getElementById('tweetLink');
const charCount     = document.getElementById('charCount');
const tweetDateBadge = document.getElementById('tweetDate');
const tweetCatBadge  = document.getElementById('tweetCategory');

/* ── Category → badge class ────────────────────────── */
function badgeClass(category) {
  const c = (category || '').toLowerCase();
  if (c.includes('feature'))      return 'feature';
  if (c.includes('issue'))        return 'issue';
  if (c.includes('deprecat'))     return 'deprecation';
  if (c.includes('announc'))      return 'announcement';
  if (c.includes('chang') || c.includes('update')) return 'changed';
  return 'default';
}

/* ── Format ISO date ────────────────────────────────── */
function fmtDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch { return iso; }
}

/* ── Build entry card HTML ──────────────────────────── */
function buildCard(entry, idx) {
  const card = document.createElement('article');
  card.className = 'entry-card';
  card.style.animationDelay = `${Math.min(idx * 0.05, 0.3)}s`;

  const updatesHTML = entry.updates.map((u, ui) => {
    const cls = badgeClass(u.category);
    // Encode data attrs for tweet button
    const safeDate     = encodeURIComponent(entry.title);
    const safeCat      = encodeURIComponent(u.category);
    const safePlain    = encodeURIComponent(u.plain_text);
    const safeLink     = encodeURIComponent(entry.link);

    return `
      <div class="update-item">
        <div class="update-item-header">
          <span class="cat-badge ${cls}">${escHtml(u.category)}</span>
          <div style="display:flex;gap:6px;align-items:center;">
            <button
              class="btn-copy-item"
              aria-label="Copy update to clipboard"
              data-text="${safePlain}"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Copy
            </button>
            <button
              class="btn-tweet-item"
              aria-label="Tweet this update"
              data-date="${safeDate}"
              data-cat="${safeCat}"
              data-text="${safePlain}"
              data-link="${safeLink}"
            >
              <svg width="13" height="13" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Tweet
            </button>
          </div>
        </div>
        <div class="update-body">${u.html}</div>
      </div>
    `;
  }).join('');

  card.innerHTML = `
    <div class="entry-header">
      <span class="entry-date">${escHtml(entry.title)}</span>
      <a class="entry-link" href="${entry.link}" target="_blank" rel="noopener noreferrer">
        View on Google Cloud ↗
      </a>
    </div>
    <div class="updates-list">${updatesHTML}</div>
  `;

  // Attach tweet listeners
  card.querySelectorAll('.btn-tweet-item').forEach(btn => {
    btn.addEventListener('click', () => {
      openTweetModal(
        decodeURIComponent(btn.dataset.date),
        decodeURIComponent(btn.dataset.cat),
        decodeURIComponent(btn.dataset.text),
        decodeURIComponent(btn.dataset.link),
      );
    });
  });

  // Attach copy listeners
  card.querySelectorAll('.btn-copy-item').forEach(btn => {
    btn.addEventListener('click', () => {
      copyToClipboard(decodeURIComponent(btn.dataset.text), btn);
    });
  });

  return card;
}

/* ── Escape HTML ────────────────────────────────────── */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── Copy to clipboard ──────────────────────────────── */
let toastTimer = null;

function showToast(msg = 'Copié !') {
  copyToast.textContent = msg;
  copyToast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => copyToast.classList.remove('show'), 2000);
}

function copyToClipboard(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    // Briefly style the button green
    btn.classList.add('copied');
    btn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      Copié !
    `;
    showToast('✓ Copié dans le presse-papiers');
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
        Copy
      `;
    }, 2000);
  }).catch(() => showToast('⚠ Erreur de copie'));
}

/* ── CSV Export ─────────────────────────────────────── */
function escCsv(val) {
  const s = String(val ?? '').replace(/"/g, '""');
  return `"${s}"`;
}

function exportCSV() {
  if (!window._feedData || !window._feedData.length) return;

  const rows = [['Date', 'Category', 'Plain Text', 'Link']];
  window._feedData.forEach(entry => {
    entry.updates.forEach(u => {
      rows.push([
        escCsv(entry.title),
        escCsv(u.category),
        escCsv(u.plain_text),
        escCsv(entry.link),
      ]);
    });
  });

  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `bigquery-release-notes-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('✓ Export CSV téléchargé');
}

/* ── Render feed ────────────────────────────────────── */
function renderFeed(entries) {
  feed.innerHTML = '';
  if (!entries || entries.length === 0) {
    emptyState.classList.remove('hidden');
    exportBtn.disabled = true;
    return;
  }
  emptyState.classList.add('hidden');
  window._feedData = entries;        // cache for CSV export
  exportBtn.disabled = false;
  entries.forEach((entry, i) => feed.appendChild(buildCard(entry, i)));

  // Stats
  const totalUpdates = entries.reduce((s, e) => s + e.updates.length, 0);
  statEntries.textContent = `${entries.length} entries · ${totalUpdates} updates`;
  const latest = entries[0]?.updated;
  statUpdated.textContent = latest ? `Latest: ${fmtDate(latest)}` : '';
  statsBar.classList.remove('hidden');
}

/* ── Fetch from API ─────────────────────────────────── */
async function fetchNotes() {
  // UI: loading state
  refreshBtn.disabled = true;
  exportBtn.disabled  = true;
  refreshIcon.classList.add('spinning');
  refreshLabel.textContent = 'Loading…';
  skeleton.classList.remove('hidden');
  feed.innerHTML = '';
  emptyState.classList.add('hidden');
  errorBanner.classList.add('hidden');
  statsBar.classList.add('hidden');

  try {
    const res = await fetch('/api/release-notes');
    const data = await res.json();

    skeleton.classList.add('hidden');

    if (!res.ok || data.status === 'error') {
      showError(data.message || `HTTP ${res.status}`);
      return;
    }

    renderFeed(data.entries);
  } catch (err) {
    skeleton.classList.add('hidden');
    showError(err.message || 'Network error');
  } finally {
    refreshBtn.disabled = false;
    refreshIcon.classList.remove('spinning');
    refreshLabel.textContent = 'Refresh';
  }
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorBanner.classList.remove('hidden');
}

/* ── Tweet Modal ────────────────────────────────────── */
function openTweetModal(date, category, plainText, link) {
  const HARD_MAX  = 280;
  const TARGET    = 210;   // aim for ~210 chars → leaves ~70 chars of editing room
  const hashtags  = '#BigQuery #GoogleCloud';
  const suffix    = `\n${link}\n${hashtags}`;
  const maxBody   = TARGET - suffix.length;  // chars available for the body text

  // Trim plain text to maxBody at a word boundary to avoid cutting mid-word
  let body = `📢 BigQuery update (${date}) — ${category}:\n${plainText}`;
  if (body.length > maxBody) {
    body = body.slice(0, maxBody).replace(/\s+\S*$/, '') + '…';
  }

  const full = body + suffix;

  // Update badge
  tweetDateBadge.textContent = date;
  tweetCatBadge.textContent  = category;
  tweetCatBadge.className    = `tweet-cat-badge cat-badge ${badgeClass(category)}`;

  tweetText.value = full;
  updateCharCount();

  tweetModal.classList.remove('hidden');
  tweetText.focus();
}


function updateTweetLink() {
  const text = tweetText.value;
  tweetLink.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

function updateCharCount() {
  const len = tweetText.value.length;
  charCount.textContent = `${len} / 280`;
  charCount.className = 'char-count';
  if (len > 260)      charCount.classList.add('warn');
  if (len > 280)      charCount.classList.add('error');
  updateTweetLink();
}

tweetText.addEventListener('input', updateCharCount);

function closeTweetModal() {
  tweetModal.classList.add('hidden');
}

modalClose.addEventListener('click', closeTweetModal);
tweetModal.addEventListener('click', e => {
  if (e.target === tweetModal) closeTweetModal();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeTweetModal();
});

/* ── Theme toggle ────────────────────────────────────── */
function applyTheme(isLight) {
  if (isLight) {
    document.documentElement.classList.add('light');
    iconSun.classList.add('hidden');    // hide sun
    iconMoon.classList.remove('hidden'); // show moon (click to go dark)
    themeToggle.title = 'Passer en mode sombre';
  } else {
    document.documentElement.classList.remove('light');
    iconSun.classList.remove('hidden'); // show sun (click to go light)
    iconMoon.classList.add('hidden');   // hide moon
    themeToggle.title = 'Passer en mode clair';
  }
}

function initTheme() {
  const saved = localStorage.getItem('bq-theme');
  // Default to dark; only go light if explicitly saved
  applyTheme(saved === 'light');
}

themeToggle.addEventListener('click', () => {
  const isLight = document.documentElement.classList.toggle('light');
  localStorage.setItem('bq-theme', isLight ? 'light' : 'dark');
  applyTheme(isLight);
});

/* ── Init ───────────────────────────────────────────── */
initTheme();   // apply saved preference before first paint
refreshBtn.addEventListener('click', fetchNotes);
exportBtn.addEventListener('click', exportCSV);
fetchNotes();   // auto-load on page open
