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

  // Situations: pick one, see the patient's screen.
  var dl = document.querySelector('#scenarios .xdata');
  if (dl) {
    var wrap = el('div', 'sx sx-phone-grid'), tabs = el('div', 'sx-tabs');
    var phone = el('div', 'sx-phone'), screen = el('div', 'sx-screen');
    var side = detail();
    phone.appendChild(screen);
    var right = el('div');
    right.appendChild(tabs);
    right.appendChild(side);
    wrap.appendChild(right);
    wrap.appendChild(phone);
    dl.parentNode.insertBefore(wrap, dl);
    picker(tabs, fromDl(dl).map(function (item) {
      item.message = item.label.replace(/,.*$/, '').replace(/[“”]/g, '');
      return item;
    }), function (item) {
      screen.innerHTML = '';
      screen.appendChild(el('p', 'sx-me', item.message));
      screen.appendChild(el('p', 'sx-reply' + (/emergency/i.test(item.title) ? ' sx-reply--urgent' : ''), item.title));
      screen.appendChild(el('p', 'sx-note', 'Illustration'));
      side.show(item);
    }, 'sx-tab');
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
    ev.parentNode.insertBefore(box, ev);
    var update = function () {
      var n = +input.value, low = n / (n + 3.84) * 100;
      box.querySelector('.sx-count').textContent = n + ' out of ' + n + ' handled correctly';
      fill.style.left = low + '%';
      out.textContent = 'The true rate could be as low as about ' + Math.round(low) + '%. Illustration only.';
    };
    input.addEventListener('input', update);
    update();
  }

  // Release: a clickable timeline built from the numbered steps.
  var ol = document.querySelector('#release .xtrust-steps');
  if (ol) {
    var line = el('div', 'sx sx-line-wrap'), steps = el('div', 'sx-steps'), sd = detail();
    line.appendChild(steps); line.appendChild(sd);
    ol.parentNode.insertBefore(line, ol);
    picker(steps, [].map.call(ol.children, function (li, i) {
      return { label: String(i + 1), title: li.querySelector('b').textContent, html: li.querySelector('p').innerHTML };
    }), sd.show, 'sx-step');
    ol.hidden = true;
  }

  pills('#responsibility');
  pills('#data');
})();
