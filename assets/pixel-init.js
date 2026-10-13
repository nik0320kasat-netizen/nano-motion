/* Nano Motion Pixel bootstrap: identical on every page. Load synchronously in <head> to install the oaiq command queue before page events run. */
(function () {
    var m = { country: 'US' }, c = null;
    try { m = JSON.parse(localStorage.getItem('nm_market') || '{"country":"US"}'); c = localStorage.getItem('nm_consent'); } catch (e) {}
    var optIn = ['GB', 'DE'].indexOf(m.country) !== -1;   // opt-in markets
    var gpc = navigator.globalPrivacyControl === true;             // browser opt-out signal (CCPA and other US states)
    window.__nmDenied = gpc || c === 'denied' || (optIn && c !== 'granted');
  })();
  (function (w, d, s, u) {
    if (w.oaiq) return;
    var q = function () { q.q.push(arguments); };
    q.q = []; w.oaiq = q;
    var js = d.createElement(s); js.async = true; js.src = u;
    var f = d.getElementsByTagName(s)[0]; f.parentNode.insertBefore(js, f);
  })(window, document, "script", "https://bzrcdn.openai.com/sdk/oaiq.min.js");
  if (window.__nmDenied) oaiq("consent", false);
  var __nmUser = {};
  try { __nmUser = JSON.parse(localStorage.getItem('nm_user') || '{}'); } catch (e) {}
  oaiq("init", {
    pixelId: "1GtqyL7Rgr4qk4pR3LFbss",
    debug: true,          // on for this demo so reviewers can see SDK activity; off in production
    user: __nmUser        // hashed identifiers only (SHA-256), plus raw country/city/postal code
  });
