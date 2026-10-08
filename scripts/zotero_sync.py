#!/usr/bin/env python3
"""Pull publications from a Zotero library/collection into data/publications.zotero.json.

Runs in GitHub Actions (see .github/workflows/zotero-sync.yml) or locally:

    ZOTERO_API_KEY=... ZOTERO_LIBRARY_TYPE=user ZOTERO_LIBRARY_ID=1234567 \
    ZOTERO_COLLECTION_KEY=ABCD1234 python3 scripts/zotero_sync.py

How an item's section on the website is chosen (first match wins):
  1. A Zotero tag  web:preprint | web:published | web:conference | web:undergraduate | web:other
  2. The name of the sub-collection it sits in (e.g. "Preprints", "Published", "Undergraduate", "Other")
  3. The Zotero item type (preprint, journal article, conference paper, thesis -> undergraduate)
Other tags it understands:
  web:hide                 leave the item off the website
  status:submitted         also status:in-preparation, status:under-review, status:accepted

Only the Python standard library is used.
"""
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

API = "https://api.zotero.org"
OUT = Path(__file__).resolve().parent.parent / "data" / "publications.zotero.json"
CATEGORIES = ("preprint", "published", "conference", "undergraduate", "other")

NAME_HINTS = [
    ("preprint", ("preprint",)),
    ("published", ("published", "journal", "article", "artículo", "articulo", "publicad")),
    ("conference", ("conference", "proceeding", "congreso", "ponencia")),
    ("undergraduate", ("undergrad", "pregrado", "thesis", "tesis")),
    ("other", ("other", "otra", "otro", "misc")),
]
TYPE_MAP = {
    "preprint": "preprint",
    "journalArticle": "published",
    "conferencePaper": "conference",
    "thesis": "undergraduate",
}


def env(name, required=True, default=None):
    value = os.environ.get(name, default)
    if required and not value:
        sys.exit(f"Missing environment variable {name}")
    return value


KEY = env("ZOTERO_API_KEY")
LIB_TYPE = env("ZOTERO_LIBRARY_TYPE", default="user").lower()
LIB_ID = env("ZOTERO_LIBRARY_ID")
COLLECTION = env("ZOTERO_COLLECTION_KEY", required=False)
PREFIX = f"{API}/{'groups' if LIB_TYPE.startswith('group') else 'users'}/{LIB_ID}"


def get(path, **params):
    """GET every page of a Zotero API listing."""
    results, start = [], 0
    while True:
        query = urllib.parse.urlencode({"format": "json", "limit": 100, "start": start, **params})
        req = urllib.request.Request(
            f"{PREFIX}{path}?{query}",
            headers={"Zotero-API-Key": KEY, "Zotero-API-Version": "3"},
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            page = json.load(resp)
            total = int(resp.headers.get("Total-Results", len(page)))
        results.extend(page)
        start += len(page)
        if not page or start >= total:
            return results


def category_from_name(name):
    low = name.lower()
    for cat, words in NAME_HINTS:
        if any(w in low for w in words):
            return cat
    return None


def year_of(date):
    m = re.search(r"(19|20)\d{2}", date or "")
    return int(m.group(0)) if m else None


def convert(data, folder_category):
    tags = [t["tag"].strip() for t in data.get("tags", [])]
    low = [t.lower() for t in tags]
    if "web:hide" in low:
        return None

    category = next((t.split(":", 1)[1] for t in low if t.startswith("web:") and t.split(":", 1)[1] in CATEGORIES), None)
    category = category or folder_category or TYPE_MAP.get(data.get("itemType"), "other")
    status = next((t.split(":", 1)[1] for t in low if t.startswith("status:")), None)

    authors = []
    for c in data.get("creators", []):
        if c.get("creatorType") not in ("author", "presenter", "programmer", None):
            continue
        if c.get("name"):
            authors.append({"literal": c["name"]})
        else:
            authors.append({"given": c.get("firstName", ""), "family": c.get("lastName", "")})

    venue = (data.get("publicationTitle") or data.get("proceedingsTitle") or data.get("conferenceName")
             or data.get("bookTitle") or data.get("university") or data.get("repository")
             or data.get("publisher") or "")
    if data.get("itemType") == "thesis" and data.get("thesisType"):
        venue = f"{data['thesisType']}, {venue}".strip(", ")

    arxiv = None
    for field in (data.get("archiveID", ""), data.get("extra", ""), data.get("url", "")):
        m = re.search(r"arxiv[:/\s]*(?:abs/)?(\d{4}\.\d{4,5}(v\d+)?)", field or "", re.I)
        if m:
            arxiv = m.group(1)
            break

    item = {
        "category": category,
        "title": data.get("title", "").strip(),
        "authors": authors,
        "year": year_of(data.get("date")),
        "venue": venue,
        "status": status,
        "doi": (data.get("DOI") or "").strip() or None,
        "arxiv": arxiv,
        "url": (data.get("url") or "").strip() or None,
        "zotero_key": data.get("key"),
    }
    return {k: v for k, v in item.items() if v not in (None, "", [])}


def main():
    folders = [(None, COLLECTION)]
    if COLLECTION:
        for sub in get(f"/collections/{COLLECTION}/collections"):
            folders.append((category_from_name(sub["data"]["name"]), sub["key"]))

    items, seen = [], set()
    for folder_category, key in folders:
        path = f"/collections/{key}/items/top" if key else "/items/top"
        for raw in get(path):
            data = raw.get("data", {})
            if data.get("itemType") in ("attachment", "note") or data.get("key") in seen:
                continue
            seen.add(data.get("key"))
            item = convert(data, folder_category)
            if item:
                items.append(item)

    items.sort(key=lambda it: (CATEGORIES.index(it["category"]) if it["category"] in CATEGORIES else 9,
                               -(it.get("year") or 0), it.get("title", "")))

    old = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {}
    if old.get("items") == items and old.get("updated"):
        print(f"No changes ({len(items)} items).")
        return

    out = {
        "_comment": "Generated by scripts/zotero_sync.py. Do not edit by hand; your next sync overwrites it.",
        "updated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "items": items,
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(items)} items to {OUT}")


if __name__ == "__main__":
    main()
