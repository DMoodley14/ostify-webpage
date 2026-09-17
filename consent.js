(function () {
  var config = window.OSTIFY_CONFIG || {};
  var KEY = 'ostify_consent';
  var ANALYTICS_COOKIES = ['ai_user', 'ai_session'];
  var instance = null;
  var banner = null;

  if (!config.appInsightsConnectionString) return;

  var signalOptOut = !!(navigator.globalPrivacyControl || navigator.doNotTrack === '1');

  function readChoice() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function saveChoice(value) {
    try { localStorage.setItem(KEY, value); } catch (e) { }
  }

  function loadAppInsights() {
    if (instance || document.querySelector('script[data-ai-loader]')) return;
    var script = document.createElement('script');
    script.src = 'https://js.monitor.azure.com/scripts/b/ai.3.gbl.min.js';
    script.crossOrigin = 'anonymous';
    script.setAttribute('data-ai-loader', '');
    script.onload = function () {
      if (!window.Microsoft || !window.Microsoft.ApplicationInsights || readChoice() !== 'granted') return;
      instance = new window.Microsoft.ApplicationInsights.ApplicationInsights({
        config: { connectionString: config.appInsightsConnectionString }
      }).loadAppInsights();
      instance.trackPageView();
    };
    document.head.appendChild(script);
  }

  function stopAppInsights() {
    if (instance) {
      try { instance.config.disableTelemetry = true; } catch (e) { }
      try { instance.getCookieMgr().setEnabled(false); } catch (e) { }
    }
    ANALYTICS_COOKIES.forEach(function (name) {
      document.cookie = name + '=; Max-Age=0; path=/; SameSite=Lax';
    });
    try {
      Object.keys(sessionStorage).forEach(function (k) { if (k.indexOf('AI_') === 0) sessionStorage.removeItem(k); });
      Object.keys(localStorage).forEach(function (k) { if (k.indexOf('AI_') === 0) localStorage.removeItem(k); });
    } catch (e) { }
  }

  function closeBanner() {
    if (banner) { banner.remove(); banner = null; }
  }

  function render(inner) {
    closeBanner();
    banner = document.createElement('div');
    banner.className = 'consent-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Cookies on ostify.co.uk');
    banner.innerHTML = '<div class="wrap consent-inner">' + inner + '</div>';
    document.body.appendChild(banner);
    banner.addEventListener('click', onClick);
  }

  function showQuestion() {
    render(
      '<div class="consent-text">' +
        '<p class="consent-title">Cookies on ostify.co.uk</p>' +
        '<p>We use some cookies necessary to making this website work. We also use additional cookies, such as those to record website analytics, which you can deny the use of. If you do not accept additional cookies, some third-party content may not load. <a href="/privacy/#cookies">Read our cookie policy</a>.</p>' +
      '</div>' +
      '<div class="consent-actions">' +
        '<button type="button" class="btn" data-consent="grant">Accept analytics cookies</button>' +
        '<button type="button" class="btn" data-consent="deny">Reject analytics cookies</button>' +
      '</div>'
    );
  }

  function showMessage(text) {
    render(
      '<div class="consent-text"><p>' + text + '</p></div>' +
      '<div class="consent-actions"><button type="button" class="btn btn--light" data-consent="hide">Hide this message</button></div>'
    );
    var hide = banner.querySelector('[data-consent="hide"]');
    if (hide) hide.focus();
  }

  function onClick(e) {
    var action = e.target.getAttribute && e.target.getAttribute('data-consent');
    if (!action) return;
    if (action === 'hide') { closeBanner(); return; }
    if (action === 'grant') {
      saveChoice('granted');
      loadAppInsights();
      closeBanner();
    } else {
      var wasGranted = readChoice() === 'granted';
      saveChoice('denied');
      if (wasGranted) stopAppInsights();
      showMessage('You’ve rejected analytics cookies. You can change your cookie settings at any time using the link at the bottom of every page.');
    }
  }

  document.addEventListener('click', function (e) {
    var link = e.target.closest && e.target.closest('[data-cookie-settings]');
    if (!link) return;
    e.preventDefault();
    if (signalOptOut) {
      showMessage('Your browser is sending a Global Privacy Control or Do Not Track signal, so we don’t set analytics cookies.');
    } else {
      showQuestion();
    }
  });

  if (signalOptOut) return;

  var choice = readChoice();
  if (choice === 'granted') loadAppInsights();
  else if (choice !== 'denied') showQuestion();
})();
