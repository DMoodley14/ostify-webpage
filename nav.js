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

