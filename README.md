# th-martinod.github.io

Personal academic website of Thomas Martinod. Plain HTML, CSS and a little JavaScript: no build step.
Every page is in English and Spanish (the EN | ES switch under the logo remembers the choice).

## Publish it on GitHub Pages

1. Create a public repository named exactly **`th-martinod.github.io`**.
2. Upload the contents of this folder to it (keep the folder structure, including the hidden `.github/` folder and `.nojekyll`).
3. In the repository: **Settings → Pages → Build and deployment → Source: Deploy from a branch → `main` / root**.
4. After a minute the site is live at **https://th-martinod.github.io**.

To preview on your computer: `python3 -m http.server` in this folder, then open http://localhost:8000.
(Opening the HTML files directly with a double click will not load the publications or the blog.)

## Files you add

| File | What it is |
|---|---|
| `assets/img/avatar.jpg` | Your square photo (at least 300 × 300 px). Until it exists, a placeholder shows. |
| `assets/img/logo.png` | Your logo, shown in the top-right corner and as the browser-tab icon. Square, transparent background works best. |
| `cv.pdf` | Your CV. The **CV** link in the menu opens it. |

## Where to edit things

| What | Where |
|---|---|
| Home page: bio, affiliations, interests, contact | `index.html` |
| Research paragraphs | `research.html` (math: `<span class="tex">…</span>` inline, `<div class="eq">…</div>` display) |
| Talks, awards, service, groups | `activities.html` |
| Teaching | `teaching.html` |
| Menu items | `NAV` at the top of `assets/js/site.js` |
| Footer links (add Google Scholar here) | `LINKS` at the top of `assets/js/site.js` |
| Colors and fonts | the `:root` block at the top of `assets/css/style.css` |

Each text appears twice, once inside `class="en"` and once inside `class="es"`. Edit both.

## Publications

The Publications page merges two files:

- `data/publications.manual.json`: entries you write by hand. The three preprints are here with working titles; when one goes on arXiv, add `"arxiv": "2601.01234"` and change `"status"`, or delete it from this file once Zotero has it.
- `data/publications.zotero.json`: written automatically from Zotero (see below). Don't edit it by hand.

If the same paper is in both (same DOI or same title), the hand-written one wins.

## Zotero sync (automatic)

A GitHub Action (`.github/workflows/zotero-sync.yml`) runs every Monday, pulls your Zotero collection, and commits the updated list. You can also run it any time from **Actions → Sync publications from Zotero → Run workflow**.

One-time setup:

1. **API key.** In Zotero go to https://www.zotero.org/settings/keys → *Create new private key*, allow **read** access to your library (and to the group, if your project is a group library). Copy the key.
2. **Library ID.**
   - Personal library: the *userID* shown on that same keys page.
   - Group library: open the group on zotero.org; the number in the URL (`zotero.org/groups/1234567/...`) is the ID.
3. **Collection key (optional).** Open the collection on zotero.org; the 8-character code after `/collections/` in the URL is the key. Leave it empty to sync the whole library.
4. In the GitHub repository, **Settings → Secrets and variables → Actions**:
   - *Secrets* tab → `ZOTERO_API_KEY` = your key
   - *Variables* tab → `ZOTERO_LIBRARY_TYPE` = `user` or `group`, `ZOTERO_LIBRARY_ID` = the ID, `ZOTERO_COLLECTION_KEY` = the collection key
5. Run the workflow once from the Actions tab.

How each item lands in a section of the page (first rule that matches):

1. A Zotero tag: `web:preprint`, `web:published`, `web:conference`, `web:undergraduate`, `web:other`.
2. The sub-collection it is in, if its name contains *Preprint*, *Published/Journal*, *Conference*, *Undergraduate/Pregrado* or *Other*.
3. The item type: Preprint → Preprints, Journal Article → Journal Articles, Conference Paper → Conference Papers, Thesis → Undergraduate Research, anything else → Other.

Extra tags: `web:hide` keeps an item off the site; `status:submitted` (or `status:in-preparation`, `status:under-review`, `status:accepted`) adds a label.

## Blog

1. Write the post in Markdown: `blog/posts/<slug>.en.md` and/or `blog/posts/<slug>.es.md`.
2. Add an entry to `blog/posts.json`:

```json
{
  "slug": "my-new-post",
  "date": "2026-11-02",
  "tags": ["academia", "math"],
  "languages": ["en", "es"],
  "title": { "en": "My new post", "es": "Mi nueva entrada" },
  "summary": { "en": "One line for the list.", "es": "Una línea para la lista." }
}
```

Tags are free text; the tag buttons on the blog page are built from them. Math works with `$…$` and `$$…$$`. Images go in `blog/img/`. Add `"draft": true` to hide a post. The two sample posts are templates: delete them (files and entries) when you publish your own.
