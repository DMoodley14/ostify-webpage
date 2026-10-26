(function(){
  var btn = document.querySelector('.menu-btn');
  var menu = document.getElementById('mobile-menu');
  if(!btn||!menu) return;

  function closeMenu(){
    menu.classList.remove('open');
    btn.setAttribute('aria-expanded','false');
    btn.setAttribute('aria-label','Open menu');
    document.body.classList.remove('menu-open');
    document.documentElement.classList.remove('menu-open');
    menu.style.maxHeight = '';
  }
  function openMenu(){
    menu.classList.add('open');
    btn.setAttribute('aria-expanded','true');
    btn.setAttribute('aria-label','Close menu');
    document.body.classList.add('menu-open');
    // Lock scrolling on the root, not the body, so the sticky header stays in view.
    document.documentElement.classList.add('menu-open');
    menu.style.maxHeight = (window.innerHeight - menu.getBoundingClientRect().top) + 'px';
  }

  btn.addEventListener('click', function(){
    if(menu.classList.contains('open')) closeMenu(); else openMenu();
  });
  menu.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', closeMenu);
  });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && menu.classList.contains('open')) { closeMenu(); btn.focus(); }
  });
  window.addEventListener('resize', function(){
    if(window.innerWidth > 820) closeMenu();
  });
})();

(function(){
  var groups = document.querySelectorAll('.nav-group');
  if(!groups.length) return;

  function closeAll(except){
    groups.forEach(function(g){
      if(g === except) return;
      g.classList.remove('open');
      g.querySelector('.nav-top').setAttribute('aria-expanded','false');
    });
  }

  groups.forEach(function(g){
    var btn = g.querySelector('.nav-top');
    btn.addEventListener('click', function(){
      var open = !g.classList.contains('open');
      closeAll(g);
      g.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    g.addEventListener('focusout', function(e){
      if(!g.contains(e.relatedTarget)) closeAll();
    });
  });
  document.addEventListener('click', function(e){
    if(!e.target.closest('.nav-group')) closeAll();
  });
  document.addEventListener('keydown', function(e){
    if(e.key !== 'Escape') return;
    var open = document.querySelector('.nav-group.open');
    if(open){ closeAll(); open.querySelector('.nav-top').focus(); }
  });
})();


// Announcement bar: the charity offer, shown on every page except pricing, until dismissed on this device.
(function(){
  var key = 'ostify-bar-charities';
  if(location.pathname.indexOf('/plans/') === 0) return;
  try { if(localStorage.getItem(key)) return; } catch(e) {}
  var bar = document.createElement('div');
  bar.className = 'xbar';
  bar.setAttribute('role', 'region');
  bar.setAttribute('aria-label', 'Announcement');
  bar.innerHTML = '<p>Our offer for independent UK health charities. <a href="/plans/#charities">Find out more <span aria-hidden="true">→</span></a></p><button type="button" class="xbar-x" aria-label="Dismiss announcement">×</button>';
  var skip = document.querySelector('.skip-link');
  if(skip) skip.after(bar); else document.body.prepend(bar);
  bar.querySelector('.xbar-x').addEventListener('click', function(){
    bar.remove();
    try { localStorage.setItem(key, '1'); } catch(e) {}
  });
})();

// Phones and tablets: the app is built for desktop, so sign-up buttons become "Contact us".
// Links are swapped for fresh copies so the sign-up click tracking does not follow them.
(function(){
  var mq = window.matchMedia('(max-width: 820px)');
  var swapped = [];
  function toContact(){
    document.querySelectorAll('a[data-signup], a[href*="ostifycustomerauth"]').forEach(function(a){
      var c = a.cloneNode(true);
      var icon = c.querySelector('svg');
      c.removeAttribute('data-signup');
      c.href = '/contact/';
      c.textContent = 'Contact us';
      if (icon) { c.appendChild(document.createTextNode(' ')); c.appendChild(icon); }
      a.replaceWith(c);
      swapped.push([c, a]);
      // If a contact button already sits beside it, keep that one (its wording is more specific)
      // and give it the main button style if the sign-up button had it.
      var twin = [].slice.call(c.parentElement.children).filter(function(s){
        return s !== c && s.tagName === 'A' && /^\/contact\/(\?|#|$)/.test(s.getAttribute('href') || '');
      })[0];
      if (twin) {
        c.hidden = true;
        if (c.classList.contains('xb--light') && twin.classList.contains('xb--ghost')) { twin.classList.replace('xb--ghost', 'xb--light'); promoted.push(twin); }
      }
    });
  }
  var promoted = [];
  function restore(){
    swapped.forEach(function(p){ p[0].replaceWith(p[1]); });
    promoted.forEach(function(t){ t.classList.replace('xb--light', 'xb--ghost'); });
    swapped = []; promoted = [];
  }
  function apply(){ if (mq.matches && !swapped.length) toContact(); else if (!mq.matches && swapped.length) restore(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(apply, 0); });
  else setTimeout(apply, 0);
  if (mq.addEventListener) mq.addEventListener('change', apply);
})();
