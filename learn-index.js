// /learn/: show how far the reader has got in each module. Progress lives
// in this browser only; learn.js writes it.
(function () {
  document.querySelectorAll(".lrn-mods a[data-module]").forEach(function (card) {
    var done = [];
    try { done = JSON.parse(localStorage.getItem("ostify.learn." + card.dataset.module + ".done") || "[]"); } catch (e) { return; }
    var total = Number(card.dataset.lessons);
    if (!done.length || !total) return;
    var meta = card.querySelector(".xguide-meta");
    meta.textContent = done.length >= total ? "Complete" : done.length + " of " + total + " lessons complete";
    meta.classList.add("lrn-progress");
  });
})();
