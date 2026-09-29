// Tabbed screenshot gallery on the home page.
document.querySelectorAll('[data-gal]').forEach(function (gal) {
  var tabs = [].slice.call(gal.querySelectorAll('[role=tab]'));
  function select(i) {
    tabs.forEach(function (t, j) {
      var on = i === j;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(t.getAttribute('aria-controls'));
      panel.hidden = !on;
      if (on) panel.querySelectorAll('.xplate').forEach(function (p) { p.classList.add('is-in'); });
    });
    tabs[i].focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(i); });
    t.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') select((i + 1) % tabs.length);
      if (e.key === 'ArrowLeft') select((i - 1 + tabs.length) % tabs.length);
    });
  });
});

// Motion: screenshots rise in, and marked elements drift at their own speed.
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var plates = [].slice.call(document.querySelectorAll('.xplate'));
  if (reduce) {
    plates.forEach(function (p) { p.classList.add('is-in'); });
    return;
  }
  // Checked on every scroll rather than with an observer, so a screenshot
  // can never be left hidden where observers are throttled.
  function reveal() {
    var vh = window.innerHeight;
    plates = plates.filter(function (p) {
      var r = p.getBoundingClientRect();
      if (r.height && r.top < vh * 0.92) { p.classList.add('is-in'); return false; }
      return true;
    });
  }
  var items = [].slice.call(document.querySelectorAll('[data-parallax]'));
  var ticking = false;
  window.addEventListener('scroll', reveal, { passive: true });
  window.addEventListener('load', reveal);
  reveal();
  // A thin bar under the top edge that fills as you read.
  var bar = document.createElement('div');
  bar.className = 'xprogress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);

  function update() {
    var vh = window.innerHeight;
    items.forEach(function (el) {
      // Measure the parent, not the element, so its own movement doesn't feed back.
      var r = el.parentElement.getBoundingClientRect();
      if (r.bottom < -300 || r.top > vh + 300) return;
      var offset = (r.top + r.height / 2 - vh / 2) * parseFloat(el.dataset.parallax);
      el.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)';
    });
    var max = document.documentElement.scrollHeight - vh;
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')';
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener('resize', update);
  update();

  // The hero chat leans a few degrees toward the pointer.
  var art = document.querySelector('.xh-art');
  var card = art && art.querySelector('.chat-demo');
  if (card && window.matchMedia('(hover: hover)').matches) {
    var hero = art.closest('.xh');
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = 'rotateY(' + (x * 8).toFixed(2) + 'deg) rotateX(' + (-y * 6).toFixed(2) + 'deg)';
    });
    hero.addEventListener('pointerleave', function () { card.style.transform = ''; });
  }
})();
