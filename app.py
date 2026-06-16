from flask import Flask, jsonify, render_template
import urllib.request
import xml.etree.ElementTree as ET
import re

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
ATOM_NS = "http://www.w3.org/2005/Atom"


def strip_html(html: str) -> str:
    """Strip HTML tags and return plain text (for tweet preview)."""
    text = re.sub(r"<[^>]+>", " ", html)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def parse_feed(xml_bytes: bytes) -> list[dict]:
    root = ET.fromstring(xml_bytes)
    entries = []
    for entry in root.findall(f"{{{ATOM_NS}}}entry"):
        title_el = entry.find(f"{{{ATOM_NS}}}title")
        updated_el = entry.find(f"{{{ATOM_NS}}}updated")
        link_el = entry.find(f"{{{ATOM_NS}}}link[@rel='alternate']")
        content_el = entry.find(f"{{{ATOM_NS}}}content")

        title = title_el.text if title_el is not None else "No title"
        updated = updated_el.text if updated_el is not None else ""
        link = link_el.get("href") if link_el is not None else "#"
        html_content = content_el.text if content_el is not None else ""

        # Parse individual updates within the entry
        updates = []
        # Split on <h3> tags to get individual update categories
        parts = re.split(r"(?=<h3>)", html_content, flags=re.IGNORECASE)
        for part in parts:
            part = part.strip()
            if not part:
                continue
            h3_match = re.match(r"<h3>(.*?)</h3>(.*)", part, re.DOTALL | re.IGNORECASE)
            if h3_match:
                category = strip_html(h3_match.group(1))
                body_html = h3_match.group(2).strip()
                plain_text = strip_html(body_html)
                updates.append({
                    "category": category,
                    "html": body_html,
                    "plain_text": plain_text,
                })
            else:
                plain = strip_html(part)
                if plain:
                    updates.append({
                        "category": "Update",
                        "html": part,
                        "plain_text": plain,
                    })

        entries.append({
            "title": title,
            "updated": updated,
            "link": link,
            "updates": updates,
        })
    return entries


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/release-notes")
def release_notes():
    try:
        req = urllib.request.Request(
            FEED_URL,
            headers={"User-Agent": "Mozilla/5.0 BigQuery-Release-Notes-Viewer/1.0"},
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            xml_bytes = resp.read()
        entries = parse_feed(xml_bytes)
        return jsonify({"status": "ok", "entries": entries})
    except Exception as exc:
        return jsonify({"status": "error", "message": str(exc)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5050)
