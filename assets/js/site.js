/* Shared header, footer, language switch and image fallbacks.
   Every page has <body data-root="" data-page="home"> (data-root="../" inside /blog/). */
(function () {
  "use strict";
  var body = document.body;
  var root = body.dataset.root || "";
  var page = body.dataset.page || "";

  // ---- Edit your links here (used in the footer on every page) ----
  var LINKS = [
    { label: "Email", href: "mailto:th.martinod@gmail.com" },
    { label: "GitHub", href: "https://github.com/th-martinod" },
    { label: "ORCID", href: "https://orcid.org/0009-0004-0365-5990" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/th-martinod" }
    // { label: "Google Scholar", href: "https://scholar.google.com/citations?user=YOUR_ID" }
  ];

  var NAV = [
    { id: "home", href: "index.html", en: "Home", es: "Inicio" },
    { id: "publications", href: "publications.html", en: "Publications", es: "Publicaciones" },
    { id: "research", href: "research.html", en: "Research", es: "Investigación" },
    { id: "activities", href: "activities.html", en: "Activities", es: "Actividades" },
    { id: "teaching", href: "teaching.html", en: "Teaching", es: "Docencia" },
    { id: "blog", href: "blog/index.html", en: "Blog", es: "Blog" },
    { id: "cv", href: "cv.pdf", en: "CV", es: "CV" }
  ];

  function el(html) {
    var t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  // ---- header ----
  var header = document.getElementById("site-header");
  if (header) {
    var items = NAV.map(function (n) {
      var cur = n.id === page ? ' aria-current="page"' : "";
      var label = n.en === n.es ? n.en : '<span class="en">' + n.en + '</span><span class="es">' + n.es + "</span>";
      return '<a href="' + root + n.href + '"' + cur + ">" + label + "</a>";
    }).join('<span class="sep" aria-hidden="true">/</span>');
    header.className = "site-header";
    header.innerHTML =
      '<nav class="site-nav" aria-label="Main">' + items + "</nav>";

    // Logo pinned to the top-right corner, with the language switch under it.
    var logo = el(
      '<div class="corner"><a class="site-logo" href="' + root + 'index.html" aria-label="Home">' +
      '<img src="' + root + 'assets/img/logo.png" data-fallback="' + root + 'assets/img/th-logo.svg" alt="Thomas Martinod logo"></a>' +
      '<div class="lang-toggle" role="group" aria-label="Language">' +
      '<button type="button" data-set-lang="en" lang="en">EN</button><span aria-hidden="true">|</span>' +
      '<button type="button" data-set-lang="es" lang="es">ES</button></div></div>'
    );
    document.body.insertBefore(logo, document.body.firstChild);
  }

  // ---- footer ----
  var footer = document.getElementById("site-footer");
  if (footer) {
    footer.className = "site-footer";
    footer.innerHTML =
      "<nav aria-label=\"Links\">" +
      LINKS.map(function (l) { return '<a href="' + l.href + '">' + l.label + "</a>"; }).join("") +
      "</nav><span>© " + new Date().getFullYear() + " Thomas Martinod</span>";
  }

  // ---- favicon from the logo ----
  if (!document.querySelector('link[rel="icon"]')) {
    var fav = document.createElement("link");
    fav.rel = "icon";
    fav.href = root + "assets/img/th-logo.svg";
    var probe = new Image();
    probe.onload = function () { fav.href = root + "assets/img/logo.png"; };
    probe.src = root + "assets/img/logo.png";
    document.head.appendChild(fav);
  }

  // ---- image fallbacks (avatar.jpg / logo.png until you add the real files) ----
  function useFallback(img) {
    if (img.dataset.fallback && img.getAttribute("src") !== img.dataset.fallback) img.src = img.dataset.fallback;
  }
  Array.prototype.forEach.call(document.querySelectorAll("img[data-fallback]"), function (img) {
    if (img.complete && img.naturalWidth === 0) useFallback(img);
    img.addEventListener("error", function () { useFallback(img); });
  });

  // ---- language ----
  function getLang() {
    return document.documentElement.classList.contains("lang-es") ? "es" : "en";
  }
  function setLang(lang, silent) {
    document.documentElement.classList.toggle("lang-es", lang === "es");
    document.documentElement.lang = lang;
    try { localStorage.setItem("lang", lang); } catch (e) {}
    Array.prototype.forEach.call(document.querySelectorAll("[data-set-lang]"), function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.setLang === lang));
    });
    var t = body.dataset["title" + (lang === "es" ? "Es" : "En")];
    if (t) document.title = t;
    if (!silent) document.dispatchEvent(new CustomEvent("langchange", { detail: { lang: lang } }));
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-set-lang]");
    if (b) setLang(b.dataset.setLang);
  });
  setLang(getLang(), true);

  window.site = { root: root, lang: getLang };
})();
