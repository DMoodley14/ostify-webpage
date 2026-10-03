(function(){
  var btn = document.querySelector('.menu-btn');
  var menu = document.getElementById('mobile-menu');
  if(!btn||!menu) return;

  function closeMenu(){
    menu.classList.remove('open');
    btn.setAttribute('aria-expanded','false');
    btn.setAttribute('aria-label','Open menu');
    document.body.classList.remove('menu-open');
  }
  function openMenu(){
    menu.classList.add('open');
    btn.setAttribute('aria-expanded','true');
    btn.setAttribute('aria-label','Close menu');
    document.body.classList.add('menu-open');
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

// Announcement bar: remember a dismissal on this device.
(function(){
  var bar = document.getElementById('xbar');
  if(!bar) return;
  var key = 'ostify-bar-hiring';
  try { if(localStorage.getItem(key)) { bar.remove(); return; } } catch(e) {}
  bar.querySelector('.xbar-x').addEventListener('click', function(){
    bar.remove();
    try { localStorage.setItem(key, '1'); } catch(e) {}
  });
})();
