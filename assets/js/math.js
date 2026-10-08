/* Renders TeX with KaTeX as native MathML (no KaTeX stylesheet needed).
   Inline:  <span class="tex">\lambda \in [0,1]</span>
   Display: <div class="eq">\dot S_{\mathrm{gen}} \ge 0</div>
   Requires katex.min.js to be loaded first. */
(function () {
  "use strict";
  function renderTex(scope) {
    if (!window.katex) return;
    Array.prototype.forEach.call((scope || document).querySelectorAll(".tex, .eq"), function (node) {
      if (node.dataset.rendered) return;
      var src = node.textContent;
      try {
        katex.render(src, node, { output: "mathml", displayMode: node.classList.contains("eq"), throwOnError: false });
        node.dataset.rendered = "1";
      } catch (e) { /* leave the TeX source visible */ }
    });
  }
  window.renderTex = renderTex;
  renderTex();
})();
