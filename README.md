# 📊 BigQuery Release Notes Viewer

A lightweight **Python Flask** web application that fetches the latest [BigQuery release notes](https://cloud.google.com/bigquery/docs/release-notes) from the official Google Cloud Atom feed, displays them in a clean dark-mode UI, and lets you share any update directly on **X (Twitter)**.

---

## ✨ Features

- 🔄 **Live feed** — fetches the official Google Cloud Atom XML feed on load
- 🎨 **Color-coded badges** — updates are categorized visually:
  - 🟢 Feature · 🔴 Issue · 🟡 Deprecation · 🟣 Announcement · 🔵 Changed
- ⏳ **Skeleton loader** — shimmer placeholder cards while data is loading
- 🔁 **Refresh button** — with animated spinner, reloads the feed on demand
- 🐦 **Tweet any update** — per-update tweet button opens a compose modal
- ✍️ **Tweet composer** — pre-fills text with date, category, summary, link & hashtags; live 280-character counter
- ⚠️ **Error handling** — friendly error banner if the feed is unreachable
- 📱 **Responsive** — works on desktop and mobile

---

## 🗂️ Project Structure

```
bigquery-release-notes/
├── app.py                  # Flask backend — fetches & parses the Atom feed
├── templates/
│   └── index.html          # Single-page HTML shell + tweet modal
├── static/
│   ├── style.css           # Dark theme, glassmorphism, animations
│   └── app.js              # Frontend logic — fetch, render, tweet modal
├── .gitignore
└── README.md
```

---

## 🏗️ Architecture

```
Browser                      Flask (Python)              Google Cloud
   │                              │                            │
   │  GET /                       │                            │
   │─────────────────────────────>│                            │
   │  ← index.html                │                            │
   │                              │                            │
   │  GET /api/release-notes      │                            │
   │─────────────────────────────>│                            │
   │                              │  GET bigquery-notes.xml    │
   │                              │───────────────────────────>│
   │                              │  ← Atom XML                │
   │                              │                            │
   │                              │  parse_feed()              │
   │                              │  XML → Python dict → JSON  │
   │  ← JSON {entries: [...]}     │                            │
   │                              │                            │
   │  renderFeed() / buildCard()  │                            │
   │  Display cards in browser    │                            │
```

> **Why proxy through Flask?** Direct browser requests to `docs.cloud.google.com` are blocked by CORS. Flask acts as a server-side proxy, fetching the XML and returning clean JSON.

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- pip

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Imel23/Imel-event-talks-app.git
cd Imel-event-talks-app

# 2. (Optional) Create a virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install flask

# 4. Run the app
python app.py
```

The app will be available at **http://127.0.0.1:5050**

---

## 🔌 API Reference

### `GET /`

Serves the main HTML page.

---

### `GET /api/release-notes`

Fetches and parses the BigQuery Atom feed. Returns structured JSON.

**Success response** `200 OK`:

```json
{
  "status": "ok",
  "entries": [
    {
      "title": "June 15, 2026",
      "updated": "2026-06-15T00:00:00-07:00",
      "link": "https://docs.cloud.google.com/bigquery/docs/release-notes#June_15_2026",
      "updates": [
        {
          "category": "Feature",
          "html": "<p>Use Gemini Cloud Assist to analyze your SQL queries...</p>",
          "plain_text": "Use Gemini Cloud Assist to analyze your SQL queries..."
        },
        {
          "category": "Issue",
          "html": "<p>Support for configuring daily token quotas...</p>",
          "plain_text": "Support for configuring daily token quotas..."
        }
      ]
    }
  ]
}
```

**Error response** `500 Internal Server Error`:

```json
{
  "status": "error",
  "message": "reason for failure"
}
```

---

## 🐦 Tweeting an Update

1. Click the **Tweet** button on any individual update card
2. A modal opens with pre-filled text:
   ```
   📢 BigQuery update (June 15, 2026) — Feature:
   Use Gemini Cloud Assist to analyze your SQL queries...
   https://docs.cloud.google.com/bigquery/docs/release-notes#June_15_2026
   #BigQuery #GoogleCloud
   ```
3. Edit the text as needed — the character counter turns yellow at 260, red at 280
4. Click **Tweet** to open Twitter's compose window with the text pre-loaded

---

## 🧠 How the Feed is Parsed

The BigQuery Atom feed groups updates by date. Each `<entry>` contains multiple update categories separated by `<h3>` tags inside a CDATA HTML block.

```
Raw XML entry content:
<h3>Feature</h3><p>Use Gemini...</p>
<h3>Issue</h3><p>Token quota disabled...</p>

         ↓  parse_feed()

[
  { "category": "Feature", "html": "...", "plain_text": "..." },
  { "category": "Issue",   "html": "...", "plain_text": "..." }
]
```

The parser uses:
- `xml.etree.ElementTree` — navigates the Atom XML tree
- `re.split(r"(?=<h3>)")` — lookahead split to separate updates without losing the `<h3>` tag
- `re.sub(r"<[^>]+>", " ")` — strips HTML tags to produce tweet-ready plain text

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3, Flask |
| HTTP client | `urllib.request` (stdlib) |
| XML parsing | `xml.etree.ElementTree` (stdlib) |
| Frontend | Vanilla HTML, CSS, JavaScript |
| Font | [Inter](https://fonts.google.com/specimen/Inter) via Google Fonts |
| Data source | [Google Cloud BigQuery Atom feed](https://docs.cloud.google.com/feeds/bigquery-release-notes.xml) |

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
