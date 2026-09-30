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

// Graphics drawn from bone itself: a live trabecular lattice behind each dark
// hero, and osteon cross-sections in place of generic floating shapes.
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SVG = 'http://www.w3.org/2000/svg';

  // Small seeded random, so each drawing is stable for its position on the page.
  function rng(seed) {
    return function () {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
  }

  /* ---------- osteon cross-sections ---------- */
  function osteon(seed, variant) {
    var r = rng(seed * 7919 + 17);
    var svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('viewBox', '-100 -100 200 200');
    svg.setAttribute('class', 'xosteon' + (variant ? ' xosteon--' + variant : ''));
    var g = document.createElementNS(SVG, 'g');
    g.setAttribute('class', 'xosteon-spin');
    svg.appendChild(g);

    function ring(radius, wobble, cls) {
      var pts = [], n = 90, phase = r() * 6.28, lobes = 2 + Math.floor(r() * 3);
      for (var i = 0; i <= n; i++) {
        var a = i / n * Math.PI * 2;
        var rr = radius + Math.sin(a * lobes + phase) * wobble + Math.sin(a * 7 + phase * 2) * wobble * 0.35;
        pts.push((Math.cos(a) * rr).toFixed(2) + ',' + (Math.sin(a) * rr).toFixed(2));
      }
      var p = document.createElementNS(SVG, 'path');
      p.setAttribute('d', 'M' + pts.join('L') + 'Z');
      p.setAttribute('class', cls);
      g.appendChild(p);
      return p;
    }

    // concentric lamellae, then the cement line around them
    var rings = variant === 'open' ? 5 : 8;
    for (var k = 0; k < rings; k++) {
      var rad = 14 + k * (76 / rings) + r() * 3;
      ring(rad, 1.2 + k * 0.35, 'xo-lam');
      // lacunae (the spaces osteocytes live in) sit between the rings
      if (k > 0 && k < rings) {
        var count = Math.floor(rad / 9);
        for (var j = 0; j < count; j++) {
          var a = (j / count) * Math.PI * 2 + r() * 0.6;
          var lr = rad - (76 / rings) / 2;
          var cx = Math.cos(a) * lr, cy = Math.sin(a) * lr;
          var e = document.createElementNS(SVG, 'ellipse');
          e.setAttribute('cx', cx.toFixed(2)); e.setAttribute('cy', cy.toFixed(2));
          e.setAttribute('rx', (2.4 + r()).toFixed(2)); e.setAttribute('ry', '1.1');
          e.setAttribute('transform', 'rotate(' + (a * 57.3 + 90).toFixed(1) + ' ' + cx.toFixed(2) + ' ' + cy.toFixed(2) + ')');
          e.setAttribute('class', 'xo-cell');
          g.appendChild(e);
          // canaliculi: fine channels reaching in and out
          for (var c = 0; c < 2; c++) {
            var dir = c ? 1 : -1, len = 3 + r() * 5;
            var l = document.createElementNS(SVG, 'line');
            l.setAttribute('x1', cx.toFixed(2)); l.setAttribute('y1', cy.toFixed(2));
            l.setAttribute('x2', (cx + Math.cos(a) * len * dir).toFixed(2));
            l.setAttribute('y2', (cy + Math.sin(a) * len * dir).toFixed(2));
            l.setAttribute('class', 'xo-can');
            g.appendChild(l);
          }
        }
      }
    }
    ring(94, 3, 'xo-cement');
    var canal = document.createElementNS(SVG, 'circle');
    canal.setAttribute('r', '8'); canal.setAttribute('class', 'xo-canal');
    g.appendChild(canal);
    return svg;
  }

  var seed = 1;
  document.querySelectorAll('.xfloat > span > i').forEach(function (i) {
    var size = parseFloat((i.getAttribute('style') || '').match(/--s:(\d+)/) ? RegExp.$1 : 140);
    var variant = i.classList.contains('xdots') ? 'open' : (i.classList.contains('xblob') ? 'soft' : '');
    var svg = osteon(seed++, variant);
    svg.style.width = svg.style.height = Math.round(size * 1.9) + 'px';
    i.replaceWith(svg);
  });

  // Keep osteons clear of anything readable. Each one tries its own spot, then
  // a ring of alternatives, then the side margin; failing that it is hidden.
  var CONTENT = 'h1,h2,h3,p,li,dt,dd,q,a,button,table,label,input,select,textarea,img,.xwin,.chat-demo,.xtag,.xflow-n,.xstage-n,.xl,.xgal-tabs,.xplate,.xh-art';
  function overlaps(a, list) {
    for (var i = 0; i < list.length; i++) {
      var b = list[i];
      if (a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t) return true;
    }
    return false;
  }
  function placeOsteons() {
    document.querySelectorAll('.xfloat').forEach(function (field) {
      var host = field.parentElement, hb = host.getBoundingClientRect();
      var W = hb.width, H = hb.height, pad = 20;
      var blocks = [].slice.call(host.querySelectorAll(CONTENT)).filter(function (el) {
        return !field.contains(el) && el.offsetParent !== null;
      }).map(function (el) {
        var r = el.getBoundingClientRect();
        return { l: r.left - hb.left - pad, r: r.right - hb.left + pad, t: r.top - hb.top - pad, b: r.bottom - hb.top + pad };
      });
      var inner = host.querySelector('.xw');
      var ib = inner ? inner.getBoundingClientRect() : hb;
      var edgeL = ib.left - hb.left + 56, edgeR = ib.right - hb.left - 56;
      var taken = [];
      field.querySelectorAll(':scope > span').forEach(function (span) {
        var svg = span.querySelector('.xosteon');
        if (!svg) return;
        if (!span.dataset.x) { span.dataset.x = parseFloat(span.style.left); span.dataset.y = parseFloat(span.style.top); }
        var size = svg.getBoundingClientRect().width || parseFloat(svg.style.width);
        // parallax moves it up and down, so reserve that travel too
        var travel = Math.abs(parseFloat(span.dataset.parallax || 0)) * window.innerHeight * 0.6;
        function box(x, y) { return { l: x, r: x + size, t: y - travel, b: y + size + travel }; }
        var ox = span.dataset.x / 100 * W, oy = span.dataset.y / 100 * H;
        var tries = [[ox, oy]];
        for (var k = 1; k <= 6; k++) {
          var d = k * size * 0.35;
          tries.push([ox + d, oy], [ox - d, oy], [ox, oy + d], [ox, oy - d]);
        }
        // side margins: mostly off the page, peeking in from the edge
        tries.push([edgeL - size, oy], [edgeR, oy], [edgeL - size, H * 0.2], [edgeR, H * 0.6]);
        var spot = null;
        for (var i = 0; i < tries.length && !spot; i++) {
          var x = Math.max(-size * 0.6, Math.min(W - size * 0.4, tries[i][0]));
          var y = Math.max(-size * 0.3, Math.min(H - size * 0.7, tries[i][1]));
          var bx = box(x, y);
          if (!overlaps(bx, blocks) && !overlaps(bx, taken)) spot = [x, y, bx];
        }
        if (spot) {
          span.style.left = spot[0] + 'px'; span.style.top = spot[1] + 'px';
          span.style.display = ''; taken.push(spot[2]);
        } else {
          span.style.display = 'none';
        }
      });
    });
  }
  placeOsteons();
  window.addEventListener('load', placeOsteons);
  var placeTimer;
  window.addEventListener('resize', function () { clearTimeout(placeTimer); placeTimer = setTimeout(placeOsteons, 150); });

  // Draw each osteon in as it reaches the viewport.
  var drawn = [].slice.call(document.querySelectorAll('.xosteon'));
  drawn.forEach(function (svg) {
    svg.querySelectorAll('path').forEach(function (p) {
      var len = p.getTotalLength ? p.getTotalLength() : 600;
      p.style.strokeDasharray = len; p.style.strokeDashoffset = reduce ? 0 : len;
    });
  });
  function drawIn() {
    var vh = window.innerHeight;
    drawn = drawn.filter(function (svg) {
      var b = svg.getBoundingClientRect();
      if (b.height && b.top < vh * 0.95 && b.bottom > 0) { svg.classList.add('is-drawn'); return false; }
      return true;
    });
  }
  window.addEventListener('scroll', drawIn, { passive: true });
  drawIn();

  /* ---------- trabecular lattice behind dark heroes ---------- */
  document.querySelectorAll('.xh').forEach(function (hero) {
    var canvas = document.createElement('canvas');
    canvas.className = 'xlattice';
    canvas.setAttribute('aria-hidden', 'true');
    hero.insertBefore(canvas, hero.firstChild);
    var ctx = canvas.getContext('2d');
    var W, H, dpr, nodes, edges, adj, pulses, mouse = { x: -9999, y: -9999 };
    var R = rng(hero.textContent.length + 3);

    function build() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = hero.clientWidth; H = hero.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var step = W < 700 ? 58 : 74;
      nodes = [];
      for (var y = -step; y < H + step; y += step * 0.86) {
        for (var x = -step; x < W + step; x += step) {
          nodes.push({ bx: x + (R() - 0.5) * step * 0.9 + (Math.round(y / step) % 2) * step / 2,
                       by: y + (R() - 0.5) * step * 0.7,
                       ph: R() * 6.28, sp: 0.25 + R() * 0.4, am: 3 + R() * 6, x: 0, y: 0, w: 0.6 + R() * 1.6 });
        }
      }
      // connect each node to its nearest neighbours, like struts of spongy bone
      edges = []; adj = nodes.map(function () { return []; });
      var seen = {};
      nodes.forEach(function (n, i) {
        var near = nodes.map(function (m, j) { return [j, (m.bx - n.bx) * (m.bx - n.bx) + (m.by - n.by) * (m.by - n.by)]; })
          .filter(function (d) { return d[0] !== i; }).sort(function (a, b) { return a[1] - b[1]; }).slice(0, 3);
        near.forEach(function (d) {
          var key = Math.min(i, d[0]) + '-' + Math.max(i, d[0]);
          if (seen[key] || d[1] > step * step * 2.4) return;
          seen[key] = 1;
          var e = { a: i, b: d[0], t: 0.4 + R() * 1.6 };
          edges.push(e); adj[i].push(e); adj[d[0]].push(e);
        });
      });
      pulses = [];
      var count = Math.round(W / 90);
      for (var p = 0; p < count; p++) pulses.push(newPulse());
    }
    function newPulse() {
      var e = edges[Math.floor(R() * edges.length)];
      return { e: e, from: R() < 0.5 ? e.a : e.b, k: R(), v: 0.004 + R() * 0.006 };
    }

    function frame(t) {
      t = (t || 0) / 1000;
      ctx.clearRect(0, 0, W, H);
      nodes.forEach(function (n) {
        n.x = n.bx + Math.sin(t * n.sp + n.ph) * n.am;
        n.y = n.by + Math.cos(t * n.sp * 0.8 + n.ph) * n.am;
        var dx = n.x - mouse.x, dy = n.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 22000) { var f = (1 - d2 / 22000) * 26; var d = Math.sqrt(d2) || 1; n.x += dx / d * f; n.y += dy / d * f; }
      });
      // struts
      edges.forEach(function (e) {
        var a = nodes[e.a], b = nodes[e.b];
        var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        var near = Math.max(0, 1 - Math.hypot(mx - mouse.x, my - mouse.y) / 220);
        ctx.strokeStyle = 'rgba(185,224,200,' + (0.17 + near * 0.4).toFixed(3) + ')';
        ctx.lineWidth = e.t + near * 1.2;
        ctx.beginPath(); ctx.moveTo(a.x, a.y);
        // a slight curve reads as bone, not wire
        ctx.quadraticCurveTo(mx + (a.y - b.y) * 0.12, my + (b.x - a.x) * 0.12, b.x, b.y);
        ctx.stroke();
      });
      // junctions
      nodes.forEach(function (n) {
        ctx.fillStyle = 'rgba(214,225,218,0.22)';
        ctx.beginPath(); ctx.arc(n.x, n.y, n.w, 0, 6.283); ctx.fill();
      });
      // questions travelling through the network
      pulses.forEach(function (p, i) {
        p.k += p.v;
        if (p.k >= 1) {
          var at = p.from === p.e.a ? p.e.b : p.e.a;
          var next = adj[at][Math.floor(R() * adj[at].length)];
          if (!next) { pulses[i] = newPulse(); return; }
          p.e = next; p.from = at; p.k = 0;
        }
        var s = nodes[p.from], d = nodes[p.from === p.e.a ? p.e.b : p.e.a];
        var x = s.x + (d.x - s.x) * p.k, y = s.y + (d.y - s.y) * p.k;
        var g = ctx.createRadialGradient(x, y, 0, x, y, 14);
        g.addColorStop(0, 'rgba(0,210,106,0.9)'); g.addColorStop(1, 'rgba(0,210,106,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 14, 0, 6.283); ctx.fill();
        ctx.fillStyle = '#B9F5D2'; ctx.beginPath(); ctx.arc(x, y, 1.8, 0, 6.283); ctx.fill();
      });
    }

    var running = false;
    function loop(t) {
      var b = hero.getBoundingClientRect();
      if (b.bottom > 0 && b.top < window.innerHeight && !document.hidden) frame(t);
      if (running) requestAnimationFrame(loop);
    }
    build();
    if (reduce) { frame(0); }
    else { running = true; requestAnimationFrame(loop); }
    window.addEventListener('resize', function () { build(); if (reduce) frame(0); });
    hero.addEventListener('pointermove', function (e) {
      var b = hero.getBoundingClientRect(); mouse.x = e.clientX - b.left; mouse.y = e.clientY - b.top;
    });
    hero.addEventListener('pointerleave', function () { mouse.x = mouse.y = -9999; });
  });
})();

// Hero chat: cycle through example agents built on Ostify.
(function () {
  var demo = document.querySelector('.xh-art .chat-demo');
  if (!demo) return;
  var ICON = {
    bone: demo.querySelector('.chat-avatar').innerHTML,
    clipboard: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4.5" width="12" height="16" rx="2"/><path d="M9.5 3h5v3h-5z"/><path d="m9.5 13 2 2 3.5-4"/></svg>',
    lungs: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5v8.5"/><path d="M12 12c-1.2 0-2 .9-2 2v3.6c0 1.6-1.3 2.7-2.9 2.3C5.3 19.6 4 17.8 4 15.8v-2.9c0-3 1.4-6 4-7 1-.4 2 .4 2 1.5V10"/><path d="M12 12c1.2 0 2 .9 2 2v3.6c0 1.6 1.3 2.7 2.9 2.3 1.8-.3 3.1-2.1 3.1-4.1v-2.9c0-3-1.4-6-4-7-1-.4-2 .4-2 1.5V10"/></svg>'
  };
  // Wording follows NHS.uk: osteoporosis prevention and DEXA scan pages,
  // colonoscopy "Getting ready", and the asthma and asthma attack pages.
  var AGENTS = [
    { icon: 'bone', theme: 'bone', name: 'Bone Health Clinic Assistant', sub: 'Answers only from approved clinic content',
      chat: [
        ['q', 'What exercise is good for my bones?'],
        ['a', 'Brisk walking, dancing and strength exercises all help. If you have osteoporosis, check with your GP first.', 'Exercise and your bones · approved'],
        ['q', 'What should I wear for my DEXA scan?'],
        ['a', 'Clothes without zips or metal buckles are best. No special preparation is needed.', 'Your DEXA scan · approved']
      ] },
    { icon: 'clipboard', theme: 'endo', name: 'Endoscopy Unit Assistant', sub: 'Preparing for your colonoscopy',
      chat: [
        ['q', 'What can I eat before my colonoscopy?'],
        ['a', 'For 2 days before, stick to plain foods like white rice, pasta or clear soup.', 'Preparing for your test · approved'],
        ['q', 'Can I take my usual tablets?'],
        ['a', 'Let the hospital know about any medicines as soon as you get your letter.', 'Your medicines · approved']
      ] },
    { icon: 'lungs', theme: 'asthma', name: 'Asthma Support Assistant', sub: 'From your respiratory clinic’s guides',
      chat: [
        ['q', 'Can someone check my inhaler technique?'],
        ['a', 'Yes. A doctor, nurse or pharmacist can show you how to use it.', 'Using your inhaler · approved'],
        ['q', 'How often should I have an asthma review?'],
        ['a', 'At least once a year, to check how well your treatment is working.', 'Asthma reviews · approved']
      ] }
  ];

  var head = demo.querySelector('.chat-head');
  var body = demo.querySelector('.chat-body');
  var i = 0, timer, paused = false;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var dots = document.createElement('div');
  dots.className = 'chat-dots';
  dots.setAttribute('role', 'tablist');
  dots.setAttribute('aria-label', 'Example agents');
  AGENTS.forEach(function (a, n) {
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-label', a.name);
    b.addEventListener('click', function () { show(n); restart(); });
    dots.appendChild(b);
  });
  demo.parentElement.appendChild(dots);

  function esc(t) { var d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
  function render(a) {
    demo.setAttribute('data-theme', a.theme);
    head.querySelector('.chat-avatar').innerHTML = ICON[a.icon];
    head.querySelector('b').textContent = a.name;
    head.querySelector(':scope > div > span').textContent = a.sub;
    body.innerHTML = a.chat.map(function (m, t) {
      if (m[0] === 'q') return '<p class="msg msg--patient" style="--t:' + t + '">' + esc(m[1]) + '</p>';
      return '<div class="msg msg--agent' + (m[0] === 'u' ? ' msg--signpost' : '') + '" style="--t:' + t + '"><p>' + esc(m[1]) +
             '</p><span class="cite">' + esc(m[2]) + '</span></div>';
    }).join('');
  }
  function mark() {
    [].forEach.call(dots.children, function (b, n) { b.setAttribute('aria-selected', n === i); });
  }
  function show(n) {
    if (n === i) return;
    i = n;
    demo.classList.add('is-swapping');
    setTimeout(function () { render(AGENTS[i]); demo.classList.remove('is-swapping'); mark(); }, 350);
  }
  function restart() {
    clearInterval(timer);
    if (!reduce) timer = setInterval(function () { if (!paused && !document.hidden) show((i + 1) % AGENTS.length); }, 9000);
  }
  demo.addEventListener('pointerenter', function () { paused = true; });
  demo.addEventListener('pointerleave', function () { paused = false; });
  demo.setAttribute('data-theme', AGENTS[0].theme);
  mark();
  restart();
})();

// Stage rail: shown while reading the pipeline, marks the current stage.
(function () {
  var rail = document.querySelector('.xrail');
  if (!rail) return;
  var links = [].slice.call(rail.querySelectorAll('a'));
  var targets = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  var start = document.getElementById('how');
  function update() {
    var vh = window.innerHeight;
    var first = start.getBoundingClientRect();
    var last = targets[targets.length - 1].getBoundingClientRect();
    rail.classList.toggle('is-on', first.bottom < vh * 0.6 && last.bottom > vh * 0.4);
    var here = -1;
    targets.forEach(function (t, i) { if (t.getBoundingClientRect().top < vh * 0.45) here = i; });
    links.forEach(function (a, i) {
      a.classList.toggle('is-here', i === here);
      if (i === here) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current');
    });
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

/* Screenshot viewer: tap a screenshot to open it full screen; pinch, double-tap or scroll to zoom */
(function () {
  var imgs = document.querySelectorAll('.xplate img');
  if (!imgs.length) return;
  var box, pic, s = 1, x = 0, y = 0, pts = {}, start = null, lastTap = 0, opener;

  function apply() {
    pic.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + s + ')';
    box.classList.toggle('is-zoomed', s > 1.01);
  }
  function reset() {
    var vw = window.innerWidth, vh = window.innerHeight, nw = pic.naturalWidth || 2000, nh = pic.naturalHeight || 1357;
    var k = Math.min(vw / nw, vh / nh), w = nw * k, h = nh * k;
    pic.style.width = w + 'px'; pic.style.height = h + 'px';
    s = 1; x = (vw - w) / 2; y = (vh - h) / 2;
    apply();
  }
  function zoomAt(cx, cy, ns) {
    ns = Math.min(5, Math.max(1, ns));
    x = cx - (cx - x) * ns / s; y = cy - (cy - y) * ns / s; s = ns;
    if (s === 1) { reset(); return; }
    apply();
  }
  function close() {
    if (!box) return;
    box.remove(); box = null; document.documentElement.style.overflow = '';
    document.removeEventListener('keydown', onKey);
    if (opener) opener.focus();
  }
  function onKey(e) { if (e.key === 'Escape') close(); }
  function open(img) {
    opener = img;
    box = document.createElement('div');
    box.className = 'xlb'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', img.alt || 'Screenshot');
    box.innerHTML = '<button class="xlb-x" type="button" aria-label="Close">×</button><img alt=""><p class="xlb-hint">Pinch or double-tap to zoom</p>';
    pic = box.querySelector('img');
    var set = img.getAttribute('srcset');
    pic.src = set ? set.split(',').pop().trim().split(' ')[0] : img.currentSrc || img.src;
    pic.alt = img.alt;
    document.body.appendChild(box);
    document.documentElement.style.overflow = 'hidden';
    requestAnimationFrame(function () { box.classList.add('is-on'); });
    pic.onload = function () { if (box) reset(); };
    if (pic.complete) reset();
    box.querySelector('.xlb-x').onclick = close;
    box.querySelector('.xlb-x').focus();
    document.addEventListener('keydown', onKey);

    box.addEventListener('wheel', function (e) { e.preventDefault(); zoomAt(e.clientX, e.clientY, s * (e.deltaY < 0 ? 1.15 : 1 / 1.15)); }, { passive: false });
    box.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.xlb-x')) return;
      box.setPointerCapture(e.pointerId);
      pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(pts);
      if (ids.length === 2) {
        var a = pts[ids[0]], b = pts[ids[1]];
        start = { d: Math.hypot(a.x - b.x, a.y - b.y), s: s };
      } else {
        start = null;
        var now = Date.now();
        if (now - lastTap < 300) { zoomAt(e.clientX, e.clientY, s > 1.01 ? 1 : 2.5); lastTap = 0; }
        else lastTap = now;
        box._moved = false;
      }
    });
    box.addEventListener('pointermove', function (e) {
      var p = pts[e.pointerId]; if (!p) return;
      var ids = Object.keys(pts);
      if (ids.length === 2 && start) {
        p.x = e.clientX; p.y = e.clientY;
        var a = pts[ids[0]], b = pts[ids[1]];
        zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, start.s * Math.hypot(a.x - b.x, a.y - b.y) / start.d);
      } else if (s > 1.01) {
        x += e.clientX - p.x; y += e.clientY - p.y; p.x = e.clientX; p.y = e.clientY; box._moved = true; apply();
      } else if (Math.abs(e.clientX - p.x) + Math.abs(e.clientY - p.y) > 8) box._moved = true;
    });
    function up(e) {
      var wasSingle = Object.keys(pts).length === 1;
      delete pts[e.pointerId];
      if (Object.keys(pts).length < 2) start = null;
      // a single tap on the dark backdrop closes the viewer when not zoomed
      if (wasSingle && !box._moved && s <= 1.01 && e.target === box) setTimeout(function () { if (lastTap && Date.now() - lastTap >= 280) close(); }, 300);
    }
    box.addEventListener('pointerup', up);
    box.addEventListener('pointercancel', up);
  }
  imgs.forEach(function (img) {
    img.setAttribute('tabindex', '0');
    img.setAttribute('role', 'button');
    img.addEventListener('click', function () { open(img); });
    img.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(img); } });
  });
})();
