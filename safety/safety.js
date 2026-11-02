// Interactive views of the Safety page. Each is built from the lists already
// in the page, so without JavaScript those lists simply stay visible.
(function () {
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  function picker(host, items, show, cls) {
    var buttons = items.map(function (item, i) {
      var b = el('button', cls, item.label);
      b.type = 'button';
      b.addEventListener('click', function () {
        buttons.forEach(function (o, j) { o.setAttribute('aria-pressed', String(i === j)); });
        show(item);
      });
      host.appendChild(b);
      return b;
    });
    buttons[0].click();
  }

  function fromDl(dl) {
    return [].map.call(dl.querySelectorAll('div'), function (row) {
      var dd = row.querySelector('dd'), b = dd.querySelector('b').cloneNode(true);
      var body = dd.cloneNode(true);
      body.removeChild(body.querySelector('b'));
      return { label: row.querySelector('dt').textContent, title: b.textContent, html: body.innerHTML };
    });
  }

  function detail() {
    var d = el('div', 'sx-detail');
    d.setAttribute('aria-live', 'polite');
    d.show = function (item) {
      d.innerHTML = '';
      d.appendChild(el('b', '', item.title));
      var p = el('p');
      p.innerHTML = item.html;
      d.appendChild(p);
    };
    return d;
  }

  function pills(section) {
    var dl = document.querySelector(section + ' .xdata');
    if (!dl) return;
    var wrap = el('div', 'sx'), row = el('div', 'sx-pills'), d = detail();
    wrap.appendChild(row);
    wrap.appendChild(d);
    dl.parentNode.insertBefore(wrap, dl);
    picker(row, fromDl(dl), d.show, 'sx-pill');
    dl.hidden = true;
  }

  // Run a message through the safeguards and watch where it stops.
  var LAYERS = ['Urgent phrases', 'Urgency detection', 'Clinical decisions', 'Harmful content',
    'Override attempts', 'Personal details', 'Your content only', 'Final answer screen'];
  var STOPS = [1, 1, 2, 2, 4, 8, 6]; // 8: clears every layer
  var dl = document.querySelector('#scenarios .xdata');
  if (dl) {
    var wrap = el('div', 'sx sr'), tabs = el('div', 'sr-m'), list = el('ol', 'sr-l');
    var side = el('div'), phone = el('div', 'sr-p'), screen = el('div', 'sr-s'), info = detail();
    LAYERS.forEach(function (name) {
      var li = el('li', '', name);
      li.appendChild(el('em'));
      list.appendChild(li);
    });
    phone.appendChild(screen);
    side.appendChild(phone);
    var left = el('div');
    left.appendChild(tabs);
    left.appendChild(info);
    wrap.appendChild(left); wrap.appendChild(list); wrap.appendChild(side);
    dl.parentNode.insertBefore(wrap, dl);
    var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches, timer;
    picker(tabs, fromDl(dl).map(function (item, i) {
      item.message = item.label.replace(/,.*$/, '').replace(/[“”]/g, '');
      item.stop = STOPS[i];
      return item;
    }), function (item) {
      clearInterval(timer);
      info.show(item);
      screen.innerHTML = '';
      screen.appendChild(el('p', 'sx-me', item.message));
      var rows = [].slice.call(list.children), at = 0;
      rows.forEach(function (r) { r.className = ''; r.querySelector('em').textContent = ''; });
      var finish = function () {
        screen.appendChild(el('p', 'sx-reply' + (/emergency/i.test(item.title) ? ' sx-reply--urgent' : ''), item.title));
        screen.appendChild(el('p', 'sx-note', 'Illustration'));
      };
      var step = function () {
        var r = rows[at];
        if (!r) { finish(); return false; }
        if (at === item.stop) {
          r.className = 'stop';
          r.querySelector('em').textContent = 'Stopped here';
          finish();
          return false;
        }
        r.className = 'pass';
        r.querySelector('em').textContent = 'Clear';
        at++;
        return true;
      };
      if (calm) { while (step()); return; }
      timer = setInterval(function () { if (!step()) clearInterval(timer); }, 240);
    }, 'sr-b');
    dl.hidden = true;
  }

  // Evidence: how sure can a perfect score make you? Wilson lower bound.
  var ev = document.querySelector('#evidence .xdata');
  if (ev) {
    var box = el('div', 'sx sx-range');
    box.appendChild(el('b', 'sx-count'));
    var input = el('input');
    input.type = 'range'; input.min = 5; input.max = 200; input.step = 5; input.value = 10;
    input.setAttribute('aria-label', 'Number of test questions');
    var bar = el('div', 'sx-bar'), fill = el('i');
    bar.appendChild(fill);
    var out = el('p');
    out.setAttribute('aria-live', 'polite');
    box.appendChild(input); box.appendChild(bar); box.appendChild(out);
    document.getElementById('range-here').appendChild(box);
    var update = function () {
      var n = +input.value, low = n / (n + 3.84) * 100;
      box.querySelector('.sx-count').textContent = n + ' out of ' + n + ' handled correctly';
      fill.style.left = low + '%';
      out.textContent = 'The true rate could be as low as about ' + Math.round(low) + '%. Illustration only.';
    };
    input.addEventListener('input', update);
    update();
  }

  // The method: four large stages.
  var ol = document.querySelector('#method .xtrust-steps');
  if (ol) {
    var line = el('div', 'sx'), steps = el('div', 'sx-stages'), sd = detail();
    line.appendChild(steps); line.appendChild(sd);
    ol.parentNode.insertBefore(line, ol);
    picker(steps, [].map.call(ol.children, function (li) {
      var name = li.querySelector('b').textContent;
      return { label: name, title: name, html: li.querySelector('p').innerHTML };
    }), sd.show, 'sx-stage');
    ol.hidden = true;
  }

  // Trace an answer: pick a sentence, see its passage and check.
  var trace = document.querySelectorAll('#tracer button');
  [].forEach.call(trace, function (b) {
    b.addEventListener('click', function () {
      [].forEach.call(trace, function (o) { o.setAttribute('aria-pressed', String(o === b)); });
      document.getElementById('st-p').textContent = b.dataset.p;
      document.getElementById('st-v').innerHTML = '';
      document.getElementById('st-v').appendChild(el('b', '', b.dataset.v));
    });
  });

  // Keep the question bar on the section being read.
  var links = [].slice.call(document.querySelectorAll('.sq a'));
  if ('IntersectionObserver' in window) {
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    links.forEach(function (a) { seen.observe(document.querySelector(a.getAttribute('href'))); });
  }

  pills('#responsibility');
  pills('#data');
})();
