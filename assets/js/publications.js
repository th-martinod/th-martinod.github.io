/* Publications list.
   Sources (merged, de-duplicated by DOI or title):
     data/publications.manual.json  – things you edit by hand (preprints, overrides)
     data/publications.zotero.json  – written automatically by scripts/zotero_sync.py
   Item fields: category, title (string or {en,es}), authors [{given,family}|{literal}],
                year, venue, status, working_title, doi, url, pdf, arxiv, code, note, placeholder */
(function () {
  "use strict";
  var root = (window.site && window.site.root) || "";
  var box = document.getElementById("pubs");
  if (!box) return;

  var SECTIONS = [
    { id: "preprint", en: "Preprints", es: "Preprints" },
    { id: "published", en: "Journal Articles", es: "Artículos en revistas" },
    { id: "conference", en: "Conference Papers", es: "Ponencias" },
    { id: "undergraduate", en: "Undergraduate Research", es: "Producción de pregrado" },
    { id: "other", en: "Other Academic Work", es: "Otra producción académica" }
  ];
  var STATUS = {
    "in-preparation": { en: "In preparation", es: "En preparación" },
    "submitted": { en: "Submitted", es: "Enviado" },
    "under-review": { en: "Under review", es: "En revisión" },
    "accepted": { en: "Accepted", es: "Aceptado" }
  };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function bi(v) {
    if (v == null || v === "") return "";
    if (typeof v === "string") return esc(v);
    if (v.en === v.es || !v.es) return esc(v.en);
    return '<span class="en">' + esc(v.en) + '</span><span class="es">' + esc(v.es) + "</span>";
  }
  function initials(given) {
    return given.split(/\s+/).filter(Boolean).map(function (part) {
      return part.split("-").map(function (p) { return p.charAt(0) + "."; }).join("-");
    }).join(" ");
  }
  function author(a) {
    if (typeof a === "string") a = { literal: a };
    var name = a.literal ? a.literal : (a.given ? initials(a.given) + " " : "") + (a.family || "");
    var me = /martinod/i.test(a.family || a.literal || "") && /^t/i.test(a.given || a.literal || "");
    return me ? '<span class="me">' + esc(name) + "</span>" : esc(name);
  }
  function authors(list) {
    list = list || [];
    if (!list.length) return "";
    var parts = list.map(author);
    if (parts.length === 1) return parts[0];
    return parts.slice(0, -1).join(", ") + ' <span class="en">and</span><span class="es">y</span> ' + parts[parts.length - 1];
  }
  function key(it) {
    if (it.doi) return "doi:" + it.doi.toLowerCase().replace(/^https?:\/\/doi\.org\//, "");
    var t = typeof it.title === "string" ? it.title : (it.title && it.title.en) || "";
    return "t:" + t.toLowerCase().replace(/[^a-z0-9]+/g, "");
  }
  function link(href, label) {
    return '<a href="' + esc(href) + '">' + label + "</a>";
  }

  function renderItem(it, n) {
    var links = [];
    if (it.pdf) links.push(link(/^https?:/.test(it.pdf) ? it.pdf : root + it.pdf, "pdf"));
    if (it.arxiv) links.push(link("https://arxiv.org/abs/" + it.arxiv, "arXiv:" + esc(it.arxiv)));
    if (it.doi) links.push(link("https://doi.org/" + it.doi.replace(/^https?:\/\/doi\.org\//, ""), "doi"));
    if (it.url && !it.doi) links.push(link(it.url, "link"));
    if (it.code) links.push(link(it.code, "code"));

    var status = it.status && STATUS[it.status] ? '<span class="chip">' + bi(STATUS[it.status]) + "</span>" : "";
    var working = it.working_title ? '<span class="chip"><span class="en">working title</span><span class="es">título provisional</span></span>' : "";
    var venue = [it.venue ? '<span class="pub-venue">' + bi(it.venue) + "</span>" : "", it.year ? esc(it.year) : ""].filter(Boolean).join(", ");

    return '<li class="pub' + (it.placeholder ? " placeholder" : "") + '">' +
      '<span class="pub-num">[' + n + "]</span><div>" +
      '<span class="pub-title">' + bi(it.title) + "</span>" + status + working + "<br>" +
      '<span class="pub-authors">' + authors(it.authors) + "</span>" +
      (/\.\s*$/.test(authors(it.authors).replace(/<[^>]+>/g, "")) ? "" : ".") +
      (venue ? " " + venue + "." : "") +
      (it.note ? ' <span class="muted">' + bi(it.note) + "</span>" : "") +
      (links.length ? '<div class="pub-links">' + links.join("") + "</div>" : "") +
      "</div></li>";
  }

  function fetchJSON(path) {
    return fetch(root + path, { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : { items: [] }; })
      .catch(function () { return { items: [] }; });
  }

  Promise.all([fetchJSON("data/publications.manual.json"), fetchJSON("data/publications.zotero.json")])
    .then(function (res) {
      var manual = res[0], zotero = res[1];
      var seen = {}, items = [];
      (manual.items || []).concat(zotero.items || []).forEach(function (it) {
        var k = key(it);
        if (seen[k]) return;
        seen[k] = true;
        items.push(it);
      });
      if (!items.length) {
        box.innerHTML = '<p class="notice"><span class="en">The publication list could not load. Open the site through a web server (GitHub Pages, or <code>python3 -m http.server</code> locally).</span><span class="es">La lista de publicaciones no cargó. Abre el sitio desde un servidor web (GitHub Pages, o <code>python3 -m http.server</code> en local).</span></p>';
        return;
      }
      var html = "";
      SECTIONS.forEach(function (sec, i) {
        var list = items.filter(function (it) { return (it.category || "other") === sec.id; });
        if (!list.length) return;
        list.sort(function (a, b) { return (b.year || 0) - (a.year || 0); });
        html += (html ? "<hr>" : "") + "<h2>" + bi(sec) + "</h2>";
        html += '<ol class="pubs">' + list.map(function (it, j) { return renderItem(it, list.length - j); }).join("") + "</ol>";
      });
      if (zotero.updated) {
        html += '<p class="mono muted" style="margin-top:2rem"><span class="en">Synced from Zotero on</span><span class="es">Sincronizado desde Zotero el</span> ' + esc(zotero.updated.slice(0, 10)) + ".</p>";
      }
      box.innerHTML = html;
    });
})();
