(function () {
  var config = window.OSTIFY_CONFIG || {};
  var KEY = 'ostify_consent';

  function loadAppInsights(connectionString) {
    var script = document.createElement('script');
    script.src = 'https://js.monitor.azure.com/scripts/b/ai.3.gbl.min.js';
    script.crossOrigin = 'anonymous';
    script.onload = function () {
      if (!window.Microsoft || !window.Microsoft.ApplicationInsights) return;
      var appInsights = new window.Microsoft.ApplicationInsights.ApplicationInsights({
        config: { connectionString: connectionString }
      }).loadAppInsights();
      appInsights.trackPageView();
    };
    document.head.appendChild(script);
  }

  function grant() {
    try { localStorage.setItem(KEY, 'granted'); } catch (e) { }
    if (config.appInsightsConnectionString) loadAppInsights(config.appInsightsConnectionString);
  }

  function deny() {
    try { localStorage.setItem(KEY, 'denied'); } catch (e) { }
  }

  function showBanner() {
    var el = document.createElement('div');
    el.className = 'consent-banner';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Cookie consent');
    el.innerHTML = '<p>We’d like to use analytics cookies to understand site traffic. See our <a href="/privacy/">website privacy information</a>.</p><div class="consent-actions"><button type="button" class="btn btn--light" data-consent="deny">Reject</button><button type="button" class="btn" data-consent="grant">Accept</button></div>';
    document.body.appendChild(el);
    el.addEventListener('click', function (e) {
      var action = e.target.getAttribute('data-consent');
      if (!action) return;
      el.remove();
      if (action === 'grant') grant(); else deny();
    });
  }

  if (!config.appInsightsConnectionString) return;
  if (navigator.globalPrivacyControl || navigator.doNotTrack === '1') return;

  var stored;
  try { stored = localStorage.getItem(KEY); } catch (e) { stored = null; }

  if (stored === 'granted') loadAppInsights(config.appInsightsConnectionString);
  else if (stored !== 'denied') showBanner();
})();
