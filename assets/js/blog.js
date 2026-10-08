/* Blog: list with tag filter (blog/index.html) and single post view (blog/post.html#slug).
   Posts are listed in blog/posts.json; each post is Markdown in blog/posts/<slug>.<lang>.md.
   Math: $inline$ and $$display$$ (rendered by KaTeX as MathML). */
(function () {
  "use strict";
  var listBox = document.getElementById("post-list");
  var tagBox = document.getElementById("tag-bar");
  var postBox = document.getElementById("post");
  var posts = [];

  function lang() { return (window.site && window.site.lang()) || "en"; }
  function pick(v, l) { return v == null ? "" : typeof v === "string" ? v : v[l] || v.en || v.es || ""; }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }
  function bi(v) {
    if (typeof v === "string") return esc(v);
    var en = pick(v, "en"), es = pick(v, "es");
    return en === es ? esc(en) : '<span class="en">' + esc(en) + '</span><span class="es">' + esc(es) + "</span>";
  }
  function fmtDate(iso) {
    var d = new Date(iso + "T12:00:00Z");
    var f = function (l) { return new Intl.DateTimeFormat(l, { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }).format(d); };
    return '<span class="en">' + f("en-US") + '</span><span class="es">' + f("es-CO") + "</span>";
  }
  function tagLinks(tags) {
    return (tags || []).map(function (t) { return '<a class="tag" href="index.html#' + encodeURIComponent(t) + '">' + esc(t) + "</a>"; }).join("");
  }

  // ---------- list ----------
  function renderList() {
    var active = decodeURIComponent(location.hash.slice(1));
    var counts = {};
    posts.forEach(function (p) { (p.tags || []).forEach(function (t) { counts[t] = (counts[t] || 0) + 1; }); });
    if (active && !counts[active]) active = "";

    tagBox.innerHTML =
      '<button type="button" class="tag" data-tag="" aria-pressed="' + (!active) + '"><span class="en">all</span><span class="es">todos</span> ' + posts.length + "</button>" +
      Object.keys(counts).sort().map(function (t) {
        return '<button type="button" class="tag" data-tag="' + esc(t) + '" aria-pressed="' + (t === active) + '">' + esc(t) + " " + counts[t] + "</button>";
      }).join("");

    var shown = posts.filter(function (p) { return !active || (p.tags || []).indexOf(active) !== -1; });
    listBox.innerHTML = shown.map(function (p) {
      return '<li class="post-item"><span class="post-date">' + fmtDate(p.date) + "</span>" +
        '<h2><a href="post.html#' + encodeURIComponent(p.slug) + '">' + bi(p.title) + "</a></h2>" +
        (p.summary ? "<p>" + bi(p.summary) + "</p>" : "") +
        '<div class="post-tags">' + tagLinks(p.tags) + "</div></li>";
    }).join("") || '<li class="muted"><span class="en">No posts yet.</span><span class="es">Aún no hay entradas.</span></li>';
  }
  if (tagBox) {
    tagBox.addEventListener("click", function (e) {
      var b = e.target.closest("[data-tag]");
      if (!b) return;
      var t = b.dataset.tag;
      if (t) location.hash = encodeURIComponent(t);
      else history.replaceState(null, "", location.pathname);
      renderList();
    });
  }

  // ---------- single post ----------
  function markdownWithMath(src) {
    var store = [];
    function keep(html) { store.push(html); return "@@MATH" + (store.length - 1) + "@@"; }
    src = src.replace(/\$\$([\s\S]+?)\$\$/g, function (_, tex) { return "\n\n" + keep('<div class="eq">' + esc(tex.trim()) + "</div>") + "\n\n"; });
    src = src.replace(/(^|[^\\$])\$([^\s$](?:[^$\n]*?[^\s\\$])?)\$/g, function (_, pre, tex) { return pre + keep('<span class="tex">' + esc(tex) + "</span>"); });
    var html = window.marked ? marked.parse(src) : "<pre>" + esc(src) + "</pre>";
    html = html.replace(/<p>\s*@@MATH(\d+)@@\s*<\/p>/g, function (_, i) { return store[+i]; });
    return html.replace(/@@MATH(\d+)@@/g, function (_, i) { return store[+i]; }).replace(/\\\$/g, "$");
  }

  function renderPost() {
    var slug = decodeURIComponent(location.hash.slice(1));
    var p = posts.filter(function (x) { return x.slug === slug; })[0];
    if (!p) {
      postBox.innerHTML = '<p><span class="en">Post not found.</span><span class="es">Entrada no encontrada.</span> <a href="index.html">← Blog</a></p>';
      return;
    }
    var want = lang();
    var langs = p.languages || ["en"];
    var use = langs.indexOf(want) !== -1 ? want : langs[0];
    document.title = pick(p.title, use) + " · Thomas Martinod";

    fetch("posts/" + p.slug + "." + use + ".md", { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function (md) {
        var note = use !== want
          ? '<p class="notice">' + (want === "es" ? "Esta entrada solo está disponible en inglés." : "This post is only available in Spanish.") + "</p>"
          : "";
        postBox.innerHTML =
          '<article class="post"><h1>' + esc(pick(p.title, use)) + "</h1>" +
          '<div class="post-meta"><span class="post-date">' + fmtDate(p.date) + '</span><div class="post-tags">' + tagLinks(p.tags) + "</div></div>" +
          note + '<div class="post-body">' + markdownWithMath(md) + "</div>" +
          '<hr><p><a href="index.html">← <span class="en">All posts</span><span class="es">Todas las entradas</span></a></p></article>';
        if (window.renderTex) window.renderTex(postBox);
      })
      .catch(function () {
        postBox.innerHTML = '<p class="notice">Could not load this post. / No se pudo cargar esta entrada.</p>';
      });
  }

  fetch("posts.json", { cache: "no-cache" })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      posts = (data.posts || data).filter(function (p) { return !p.draft; });
      posts.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
      if (listBox) renderList();
      if (postBox) renderPost();
    })
    .catch(function () {
      var box = listBox || postBox;
      if (box) box.innerHTML = '<p class="notice">Open the site through a web server to see the blog (GitHub Pages, or <code>python3 -m http.server</code>).</p>';
    });

  window.addEventListener("hashchange", function () { if (listBox) renderList(); if (postBox) renderPost(); });
  document.addEventListener("langchange", function () { if (postBox && posts.length) renderPost(); });
})();
