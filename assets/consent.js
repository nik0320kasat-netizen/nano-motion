/*
 * Consent banner for opt-in markets (UK, Germany).
 *
 * The head snippet on every page already called oaiq('consent', false) BEFORE
 * init when the market requires opt-in and the visitor has not accepted.
 * While denied, the Pixel sends nothing and blocked events are not replayed.
 *
 * In production, Nano Motion's consent platform (OneTrust, Osano, etc.) would
 * make these same two calls. This banner stands in for it.
 */
(function () {
  var NM = window.NM;

  function grant() {
    NM.setConsent('granted');
    if (typeof window.oaiq === 'function') window.oaiq('consent', true);
    if (window.NMLog) window.NMLog.add({ event: 'consent', status: 'sent', note: 'granted: future events will send', data: { consent: true } });
    close();
  }
  function deny() {
    NM.setConsent('denied');
    if (typeof window.oaiq === 'function') window.oaiq('consent', false);
    if (window.NMLog) window.NMLog.add({ event: 'consent', status: 'held', note: 'denied: nothing sends, pixel cookies removed', data: { consent: false } });
    close();
  }
  function close() {
    var b = document.getElementById('nm-consent');
    if (b) b.remove();
  }

  function show() {
    if (document.getElementById('nm-consent')) return;
    var m = NM.market();
    var b = document.createElement('div');
    b.id = 'nm-consent';
    b.className = 'consent';
    b.setAttribute('role', 'dialog');
    b.setAttribute('aria-label', 'Measurement consent');
    b.innerHTML =
      '<div class="consent-text"><strong>Your choice, ' + NM.esc(m.label) + '.</strong> ' +
      'We use an advertising measurement pixel to understand whether our ads lead to purchases. ' +
      'Nothing is sent until you agree. <a href="privacy.html">Privacy notice</a></div>' +
      '<div class="consent-actions">' +
        '<button type="button" class="btn btn-ghost" data-c="deny">Decline</button>' +
        '<button type="button" class="btn" data-c="grant">Accept</button>' +
      '</div>';
    document.body.appendChild(b);
    b.querySelector('[data-c=grant]').onclick = grant;
    b.querySelector('[data-c=deny]').onclick = deny;
  }

  window.NMConsent = {
    grant: grant, deny: deny, show: show,
    // US-style opt-out from the footer link
    optOut: function () { deny(); location.reload(); },
    optIn: function () { grant(); location.reload(); }
  };

  function init() {
    if (NM.market().optIn && NM.consentState() === 'unset') show();
    // Log the GPC opt-out once per browser session so it is visible in the demo log
    var logged = false;
    try { logged = sessionStorage.getItem('nm_gpc_logged') === '1'; } catch (e) {}
    if (NM.gpc() && NM.consentState() !== 'granted' && !logged && window.NMLog) {
      window.NMLog.add({ event: 'consent', status: 'held', note: 'Global Privacy Control detected: opted out', data: { consent: false, gpc: true } });
      try { sessionStorage.setItem('nm_gpc_logged', '1'); } catch (e) {}
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
