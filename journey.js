/* Animated walk-through of what happens to one message. Markup lives in index.html (#journey). */
(function(){
  var root = document.querySelector('[data-journey]');
  if (!root) return;
  var gates = [].slice.call(root.querySelectorAll('.xj-gates li[data-gate]'));
  var tabs = [].slice.call(root.querySelectorAll('.xj-tab'));
  var msgIn = root.querySelector('.xj-msg--in');
  var msgOut = root.querySelector('.xj-msg--out');
  var outText = root.querySelector('.xj-out-text');
  var outCite = root.querySelector('.xj-out-cite');
  var status = root.querySelector('.xj-status');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var scenarios = [
    { msg: 'I’m Sarah Jones, NHS number 485 777 3456. What should I bring to my appointment?',
      redacted: 'I’m [name removed], NHS number [removed]. What should I bring to my appointment?',
      stop: -1,
      out: 'Please bring your appointment letter, a list of the medicines you take, and something to read. Most people are at the unit for 2 to 4 hours.',
      cite: 'Your appointment · approved',
      status: 'Answered from your approved content, with personal details removed first.' },
    { msg: 'Had my colonoscopy this morning. There’s quite a lot of blood now and I feel a bit dizzy',
      stop: 'urgency',
      out: 'This may need urgent help. Call 999 or go to A&E now. If you are unsure, call NHS 111.',
      cite: 'Your urgent-help message · fixed wording',
      status: 'Caught as urgent, even in everyday words. No AI-written reply.' },
    { msg: 'Honestly I don’t see the point in carrying on any more',
      stop: 'urgency',
      out: 'Thank you for telling me. It sounds like things are really hard right now, and you don’t have to face this alone. You can talk to Samaritans for free, day or night, on 116 123. If you feel you might act on these thoughts, please call 999 or go to A&E now.',
      cite: 'Your crisis message · fixed wording',
      status: 'Emotional distress is treated as urgent. It does not try to counsel.' },
    { msg: 'I’m on warfarin. Should I stop taking it before my procedure?',
      stop: 'clinical',
      out: 'That’s an important question, and the answer depends on your own health, so it needs to come from your care team. Please don’t stop or change any medicine until you’ve spoken to them. You can reach the unit on the number in your appointment letter.',
      cite: 'Declined and referred · fixed wording',
      status: 'Medicines decisions always go to your clinical team.' },
    { msg: 'Can I bring my dog with me to the hospital?',
      stop: 'relevance',
      out: 'I don’t have information on that. Please contact the unit directly.',
      cite: 'Your out-of-scope message · fixed wording',
      status: 'Not covered by your content, so it does not guess.' }
  ];

  var gateList = root.querySelector('.xj-gates');
  var rail = document.createElement('span'); rail.className = 'xj-rail'; rail.setAttribute('aria-hidden', 'true');
  var fill = document.createElement('span'); fill.className = 'xj-rail-fill'; rail.appendChild(fill);
  gateList.appendChild(rail);
  var now = document.createElement('p'); now.className = 'xj-now'; now.setAttribute('aria-hidden', 'true');
  gateList.parentNode.insertBefore(now, gateList.nextSibling);
  var typing = document.createElement('div'); typing.className = 'xj-typing'; typing.hidden = true;
  typing.innerHTML = '<i></i><i></i><i></i><span>Running safety checks</span>';
  msgOut.parentNode.insertBefore(typing, msgOut);
  var replay = document.createElement('button'); replay.type = 'button'; replay.className = 'xj-replay'; replay.textContent = 'Play again';
  replay.hidden = true; status.parentNode.insertBefore(replay, status.nextSibling);

  var current = 0, timers = [], auto = true, visible = false, running = false, nextTimer = null;
  function later(fn, ms){ timers.push(setTimeout(fn, ms)); }
  function clear(){ timers.forEach(clearTimeout); timers = []; clearTimeout(nextTimer); nextTimer = null; }
  function railTo(g, stop){
    if (!g){ fill.style.height = '0px'; return; }
    var top = gates[0].offsetTop + 18;
    fill.style.top = top + 'px';
    fill.style.height = Math.max(0, g.offsetTop + 18 - top) + 'px';
    fill.classList.toggle('is-stop', !!stop);
  }
  function reset(){
    gates.forEach(function(g){ g.classList.remove('is-active','is-pass','is-stop','is-skip'); });
    msgOut.hidden = true; msgOut.classList.remove('is-stop');
    msgIn.classList.remove('is-redacted');
    typing.hidden = true; replay.hidden = true;
    status.textContent = ''; railTo(null); now.textContent = '';
  }

  function play(i){
    clear(); reset(); running = true; current = i;
    var sc = scenarios[i];
    tabs.forEach(function(t, n){ t.setAttribute('aria-selected', n === i ? 'true' : 'false'); });
    var strip = tabs[i].parentNode;
    if (strip.scrollWidth > strip.clientWidth) strip.scrollTo({ left: tabs[i].offsetLeft - 14, behavior: reduce ? 'auto' : 'smooth' });
    var stopIdx = sc.stop === -1 ? -1 : gates.findIndex(function(g){ return g.dataset.gate === sc.stop; });

    function finish(){
      typing.hidden = true;
      outText.textContent = sc.out; outCite.textContent = sc.cite;
      msgOut.classList.toggle('is-stop', stopIdx !== -1);
      msgOut.hidden = false; status.textContent = sc.status; running = false; replay.hidden = false;
      if (auto && !reduce) nextTimer = setTimeout(function(){ if (visible) play((current + 1) % scenarios.length); }, 5000);
    }

    if (reduce){
      msgIn.textContent = sc.redacted || sc.msg;
      gates.forEach(function(g, n){
        if (stopIdx === -1 || n < stopIdx) g.classList.add('is-pass');
        else if (n === stopIdx) g.classList.add('is-stop');
        else g.classList.add('is-skip');
      });
      railTo(gates[stopIdx === -1 ? gates.length - 1 : stopIdx], stopIdx !== -1);
      now.textContent = stopIdx === -1 ? 'All ' + gates.length + ' checks passed' : 'Stopped at ' + gates[stopIdx].querySelector('b').textContent.toLowerCase();
      finish(); return;
    }

    // type the message, then walk the gates
    msgIn.textContent = '';
    var c = 0, step = Math.max(12, Math.min(28, 1100 / sc.msg.length));
    (function type(){
      c++; msgIn.textContent = sc.msg.slice(0, c);
      if (c < sc.msg.length) later(type, step); else later(walk, 350);
    })();

    function walk(){
      typing.hidden = false;
      var n = 0;
      (function next(){
        if (n > 0) gates[n-1].classList.replace('is-active', 'is-pass');
        if (n === gates.length){ now.textContent = 'All ' + gates.length + ' checks passed'; later(finish, 300); return; }
        var g = gates[n];
        g.classList.add('is-active'); railTo(g); now.textContent = (n + 1) + ' of ' + gates.length + ': ' + g.querySelector('b').textContent;
        if (g.dataset.gate === 'pii' && sc.redacted){ msgIn.textContent = sc.redacted; msgIn.classList.add('is-redacted'); }
        if (n === stopIdx){
          later(function(){
            g.classList.replace('is-active', 'is-stop'); railTo(g, true); now.textContent = 'Stopped at ' + g.querySelector('b').textContent.toLowerCase();
            for (var k = n + 1; k < gates.length; k++) gates[k].classList.add('is-skip');
            later(finish, 250);
          }, 700);
          return;
        }
        n++; later(next, g.dataset.gate === 'pii' ? 800 : 380);
      })();
    }
  }

  tabs.forEach(function(t, i){ t.addEventListener('click', function(){ auto = false; play(i); }); });
  // compact picker for small screens: previous / next around the selected example
  var strip = tabs[0].parentNode;
  var prev = document.createElement('button'), nxt = document.createElement('button'), count = document.createElement('span');
  prev.type = nxt.type = 'button'; prev.className = 'xj-nav xj-nav--prev'; nxt.className = 'xj-nav xj-nav--next';
  prev.setAttribute('aria-label', 'Previous example'); nxt.setAttribute('aria-label', 'Next example');
  prev.innerHTML = '<svg viewBox="0 0 24 24"><path d="m14.5 6-6 6 6 6"/></svg>'; nxt.innerHTML = '<svg viewBox="0 0 24 24"><path d="m9.5 6 6 6-6 6"/></svg>';
  count.className = 'xj-count'; count.setAttribute('aria-hidden', 'true');
  strip.insertBefore(prev, strip.firstChild); strip.appendChild(count); strip.appendChild(nxt);
  prev.addEventListener('click', function(){ auto = false; play((current + scenarios.length - 1) % scenarios.length); });
  nxt.addEventListener('click', function(){ auto = false; play((current + 1) % scenarios.length); });
  var origPlay = play; play = function(i){ count.textContent = (i + 1) + ' of ' + scenarios.length; origPlay(i); };
  replay.addEventListener('click', function(){ auto = false; play(current); });

  if ('IntersectionObserver' in window){
    new IntersectionObserver(function(entries){
      visible = entries[0].isIntersecting;
      if (visible && !running && !nextTimer) play(current);
      if (!visible && auto) clear(), running = false;
    }, { threshold: 0.3 }).observe(root);
  } else { visible = true; play(0); }
})();
