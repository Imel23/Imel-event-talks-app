/* ── DOM refs ──────────────────────────────────────── */
const refreshBtn   = document.getElementById('refreshBtn');
const refreshIcon  = document.getElementById('refreshIcon');
const refreshLabel = document.getElementById('refreshLabel');
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

/* ── Render feed ────────────────────────────────────── */
function renderFeed(entries) {
  feed.innerHTML = '';
  if (!entries || entries.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');
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
  // Build a sensible default tweet text (280-char aware)
  const MAX = 280;
  const hashtags = '#BigQuery #GoogleCloud';
  const suffix   = `\n${link}\n${hashtags}`;
  const maxBody  = MAX - suffix.length;

  let body = `📢 BigQuery update (${date}) — ${category}:\n${plainText}`;
  if (body.length > maxBody) body = body.slice(0, maxBody - 1) + '…';

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

/* ── Init ───────────────────────────────────────────── */
refreshBtn.addEventListener('click', fetchNotes);
fetchNotes();   // auto-load on page open
