(function () {
  var config = window.OSTIFY_CONFIG || {};
  var allowed = ['plan_click', 'free_product_click', 'enquiry_started', 'email_prepared', 'enquiry_submitted'];
  window.ostifyTrack = function (event) {
    if (allowed.indexOf(event) === -1 || !config.analyticsEndpoint || navigator.globalPrivacyControl || navigator.doNotTrack === '1') return;
    // No names, email addresses, messages, query strings or persistent identifiers.
    fetch(config.analyticsEndpoint, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({event:event,path:location.pathname}), keepalive:true}).catch(function () {});
  };
  document.querySelectorAll('a[href="/plans/"]').forEach(function (a) {
    a.addEventListener('click',function () { window.ostifyTrack('plan_click'); });
  });
  if (config.freeProductUrl) {
    document.querySelectorAll('a[data-free-product]').forEach(function (a) {
      a.href = config.freeProductUrl; a.hidden = false;
      a.addEventListener('click',function () { window.ostifyTrack('free_product_click'); });
    });
  }
})();
