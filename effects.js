(function(){
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nav = document.querySelector('.nav');

  /* sticky nav: hairline once the page has scrolled */
  function navState(){ if(nav) nav.classList.toggle('scrolled', window.scrollY > 8); }
  navState();
  window.addEventListener('scroll', navState, {passive:true});

  var revealables = document.querySelectorAll('[data-reveal],[data-reveal-stagger]');
  if(reduce || !('IntersectionObserver' in window)){
    revealables.forEach(function(el){ el.classList.add('in'); });
    return;
  }

  /* stagger indices for grid children */
  document.querySelectorAll('[data-reveal-stagger]').forEach(function(group){
    Array.prototype.forEach.call(group.children, function(child, i){
      child.style.setProperty('--i', i);
    });
  });

  /* scroll reveal */
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, {rootMargin:'0px 0px -8% 0px', threshold:0.1});
  revealables.forEach(function(el){ io.observe(el); });

  /* parallax on framed images */
  var items = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
  var ticking = false;
  function update(){
    ticking = false;
    var vh = window.innerHeight;
    items.forEach(function(el){
      var frame = el.parentElement.getBoundingClientRect();
      if(frame.bottom < 0 || frame.top > vh) return;
      var progress = ((frame.top + frame.height / 2) - vh / 2) / vh;
      var speed = parseFloat(el.getAttribute('data-parallax')) || 12;
      el.style.setProperty('--py', (progress * -speed).toFixed(3) + '%');
    });
  }
  function request(){ if(!ticking){ ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', request, {passive:true});
  window.addEventListener('resize', request);
  update();

  /* cursor spotlight on door cards */
  document.querySelectorAll('.door').forEach(function(card){
    card.addEventListener('pointermove', function(ev){
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (ev.clientX - r.left) + 'px');
      card.style.setProperty('--my', (ev.clientY - r.top) + 'px');
    });
  });
})();
