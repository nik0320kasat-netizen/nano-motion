/*
 * Nano Motion advertising measurement controls.
 * One accessible preferences panel, with regional defaults and a consistent
 * footer entry point. This is a demo interface, not a production CMP.
 *
 * US/JP: opt-out default (unless a preference exists).
 * UK/DE: affirmative opt-in before measurement.
 * GPC: authoritative opt-out; website controls cannot override it.
 * Measurement events blocked before permission are never replayed.
 */
(function () {
  var NM = window.NM;

  function isEnabled() { return NM.consentGranted(); }
  function report(enabled) {
    if (window.NMLog) window.NMLog.add({
      event: 'consent', status: enabled ? 'sent' : 'held',
      note: enabled ? 'enabled: subsequent eligible events can send' : 'disabled: subsequent events suppressed',
      data: { consent: enabled, gpc: NM.gpc() }
    });
  }
  function setEnabled(enabled) {
    if (NM.gpc()) return false; // respect browser-level privacy preference
    NM.setConsent(enabled ? 'granted' : 'denied');
    if (!enabled) {
      try { localStorage.removeItem('nm_user'); } catch (e) {}
    }
    if (typeof window.oaiq === 'function') window.oaiq('consent', enabled);
    report(enabled);
    updateSettings();
    return true;
  }
  function closeBanner() {
    var b = document.getElementById('nm-consent');
    if (b) b.remove();
  }

  function showBanner() {
    if (document.getElementById('nm-consent') || NM.gpc()) return;
    var m = NM.market();
    var b = document.createElement('div');
    b.id = 'nm-consent';
    b.className = 'consent';
    b.setAttribute('role', 'region');
    b.setAttribute('aria-label', 'Advertising measurement choice');
    b.innerHTML =
      '<div class="consent-text"><strong>Your privacy matters.</strong> ' +
      'Can we measure whether our ads lead to purchases and Club memberships? ' +
      'Shopping works the same either way. <a href="privacy.html">Learn more</a></div>' +
      '<div class="consent-actions">' +
        '<button type="button" class="btn btn-ghost" data-c="deny">Decline</button>' +
        '<button type="button" class="btn" data-c="grant">Allow measurement</button>' +
      '</div>';
    document.body.appendChild(b);
    b.querySelector('[data-c=grant]').addEventListener('click', function () {
      setEnabled(true); closeBanner();
    });
    b.querySelector('[data-c=deny]').addEventListener('click', function () {
      setEnabled(false); closeBanner();
    });
  }

  function statusCopy() {
    if (NM.gpc()) return 'Off — your browser’s Global Privacy Control preference is respected.';
    return isEnabled()
      ? 'On — you can turn this off at any time.'
      : 'Off — shopping works normally without advertising measurement.';
  }
  function updateSettings() {
    var toggle = document.getElementById('nm-measure-toggle');
    var status = document.getElementById('nm-measure-status');
    if (!toggle || !status) return;
    var on = isEnabled();
    toggle.setAttribute('aria-checked', on ? 'true' : 'false');
    toggle.setAttribute('aria-label', 'Advertising measurement ' + (on ? 'on' : 'off'));
    toggle.disabled = NM.gpc();
    status.textContent = statusCopy();
  }
  function showSettings() {
    var dialog = document.getElementById('nm-privacy-dialog');
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.id = 'nm-privacy-dialog';
      dialog.className = 'nm-privacy-dialog';
      dialog.setAttribute('aria-labelledby', 'nm-privacy-title');
      dialog.innerHTML =
        '<div class="nm-privacy-heading"><h2 id="nm-privacy-title">Your Privacy Choices</h2>' +
          '<button type="button" class="nm-privacy-close" aria-label="Close privacy settings">×</button></div>' +
        '<p>Choose whether Nano Motion can measure purchases and Club sign-ups to understand our advertising.</p>' +
        '<div class="nm-privacy-setting"><div class="nm-privacy-setting-text">' +
            '<strong id="nm-toggle-label">Advertising measurement</strong>' +
            '<span>Optional. Your choice will not affect your shopping experience.</span></div>' +
          '<button type="button" id="nm-measure-toggle" role="switch" aria-labelledby="nm-toggle-label" aria-checked="false" class="nm-measure-switch"><span aria-hidden="true"></span></button></div>' +
        '<p class="nm-privacy-status" id="nm-measure-status" role="status" aria-live="polite"></p>' +
        '<p class="nm-privacy-fine">Your choice is saved in this browser. You can change it here at any time.' +
          ' <a href="privacy.html">Read our privacy notice</a>.</p>' +
        '<div class="nm-privacy-actions"><button type="button" class="btn nm-privacy-done">Done</button></div>';
      document.body.appendChild(dialog);
      dialog.querySelector('.nm-privacy-close').addEventListener('click', function () { dialog.close(); });
      dialog.querySelector('.nm-privacy-done').addEventListener('click', function () { dialog.close(); });
      dialog.querySelector('#nm-measure-toggle').addEventListener('click', function () {
        if (!NM.gpc()) setEnabled(!isEnabled());
      });
      dialog.addEventListener('click', function (e) {
        if (e.target === dialog) dialog.close();
      });
    }
    updateSettings();
    if (!dialog.open) dialog.showModal();
  }

  window.NMConsent = {
    grant: function () { var changed = setEnabled(true); closeBanner(); return changed; },
    deny: function () { var changed = setEnabled(false); closeBanner(); return changed; },
    show: showSettings,
    showSettings: showSettings,
    optOut: function () { setEnabled(false); closeBanner(); },
    optIn: function () { setEnabled(true); closeBanner(); }
  };

  function init() {
    if (NM.market().optIn && NM.consentState() === 'unset' && !NM.gpc()) showBanner();
    var logged = false;
    try { logged = sessionStorage.getItem('nm_gpc_logged') === '1'; } catch (e) {}
    if (NM.gpc() && !logged && window.NMLog) {
      window.NMLog.add({ event: 'consent', status: 'held',
        note: 'Global Privacy Control honored: advertising measurement off',
        data: { consent: false, gpc: true } });
      try { sessionStorage.setItem('nm_gpc_logged', '1'); } catch (e) {}
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
