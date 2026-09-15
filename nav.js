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
