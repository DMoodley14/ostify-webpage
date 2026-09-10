(function(){
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nav = document.querySelector('.nav');

  /* sticky nav: hairline once the page has scrolled */
  function navState(){ if(nav) nav.classList.toggle('scrolled', window.scrollY > 8); }
  navState();
  window.addEventListener('scroll', navState, {passive:true});

  /* product showcase tabs — runs whatever the motion preference */
  var tablist = document.querySelector('.tablist');
  if(tablist){
    var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));
    var panels = tabs.map(function(t){ return document.getElementById(t.getAttribute('aria-controls')); });

    function select(i, moveFocus){
      tabs.forEach(function(tab, j){
        var on = i === j;
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
        tab.setAttribute('tabindex', on ? '0' : '-1');
        if(panels[j]) panels[j].hidden = !on;
      });
      if(moveFocus) tabs[i].focus();
      /* keep the active pill in view when the strip scrolls horizontally */
      if(tablist.scrollWidth > tablist.clientWidth){
        var t = tabs[i];
        tablist.scrollTo({
          left: t.offsetLeft - (tablist.clientWidth - t.offsetWidth) / 2,
          behavior: reduce ? 'auto' : 'smooth'
        });
      }
    }
    select(0, false);

    tabs.forEach(function(tab, i){
      tab.addEventListener('click', function(){ select(i, false); });
      tab.addEventListener('keydown', function(e){
        var last = tabs.length - 1, next = null;
        if(e.key === 'ArrowDown' || e.key === 'ArrowRight') next = i === last ? 0 : i + 1;
        else if(e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = i === 0 ? last : i - 1;
        else if(e.key === 'Home') next = 0;
        else if(e.key === 'End') next = last;
        if(next !== null){ e.preventDefault(); select(next, true); }
      });
    });
  }

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
