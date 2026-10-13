/*
 * Demo event log. Turn on with ?demo=1 (remembered for the browser session),
 * off with ?demo=0. Normal visitors never see it. Entries survive page
 * navigation (sessionStorage) so the whole journey is visible at the end.
 */
(function () {
  var KEY = 'nm_log';
  var p = new URLSearchParams(location.search).get('demo');
  try {
    if (p === '1') sessionStorage.setItem('nm_demo', '1');
    if (p === '0') sessionStorage.removeItem('nm_demo');
  } catch (e) {}

  function enabled() { try { return sessionStorage.getItem('nm_demo') === '1'; } catch (e) { return false; } }
  function entries() { try { return JSON.parse(sessionStorage.getItem(KEY) || '[]'); } catch (e) { return []; } }
  function save(list) { try { sessionStorage.setItem(KEY, JSON.stringify(list.slice(0, 200))); } catch (e) {} }

  var TIER = {
    order_created: 'T1', subscription_created: 'T1', trial_started: 'T1',
    checkout_started: 'T2', items_added: 'T2', contents_viewed: 'T2', registration_completed: 'T2', page_viewed: 'T2'
  };

  function tierOf(name) {
    if (name.indexOf('custom:') === 0) return 'T3';
    if (name.indexOf('init') === 0) return 'ID';
    return TIER[name] || '';
  }

  var panel, list;

  function render() {
    if (!panel) return;
    var items = entries();
    list.innerHTML = items.length ? '' : '<li class="nmlog-empty">No events yet. Browse the store.</li>';
    items.forEach(function (e) {
      var li = document.createElement('li');
      li.className = 'nmlog-row nmlog-' + e.status;
      var t = tierOf(e.event);
      var payload = { data: e.data };
      if (e.options) payload.options = e.options;
      var shown = e.shown ? '<div class="nmlog-shown">Entered: ' + NM.esc(JSON.stringify(e.shown)) + ' → sent only as SHA-256 hashes</div>' : '';
      li.innerHTML =
        '<button class="nmlog-head" type="button">' +
          '<span class="nmlog-time">' + e.time + '</span>' +
          (t ? '<span class="nmlog-tier nmlog-tier-' + t + '">' + t + '</span>' : '') +
          '<span class="nmlog-name">' + NM.esc(e.event) + '</span>' +
          '<span class="nmlog-status">' + NM.esc(e.status + (e.note ? ' · ' + e.note : '')) + '</span>' +
        '</button>' +
        '<div class="nmlog-body">' + shown + (e.data ? '<pre>' + NM.esc(JSON.stringify(payload, null, 2)) + '</pre>' : '') + '</div>';
      li.querySelector('.nmlog-head').addEventListener('click', function () { li.classList.toggle('open'); });
      list.appendChild(li);
    });
  }

  function mount() {
    if (!enabled() || panel) return;
    panel = document.createElement('aside');
    panel.className = 'nmlog';
    panel.setAttribute('aria-label', 'Pixel event log');
    panel.innerHTML =
      '<div class="nmlog-bar">' +
        '<strong>OpenAI Pixel · event log</strong>' +
        '<span class="nmlog-legend">T1 pay for · T2 volume · T3 insight</span>' +
        '<button type="button" data-act="clear" title="Clear the log">Clear</button>' +
        '<button type="button" data-act="min" title="Minimize">–</button>' +
        '<button type="button" data-act="close" title="Close (reopen with ?demo=1)">×</button>' +
      '</div><ol class="nmlog-list"></ol>';
    document.body.appendChild(panel);
    document.body.classList.add('has-nmlog');
    list = panel.querySelector('.nmlog-list');
    var minBtn = panel.querySelector('[data-act=min]');
    function setMin(on) {
      panel.classList.toggle('min', on);
      document.body.classList.toggle('nmlog-min', on);
      minBtn.textContent = on ? '+' : '–';
      minBtn.title = on ? 'Expand' : 'Minimize';
      try { on ? sessionStorage.setItem('nm_demo_min', '1') : sessionStorage.removeItem('nm_demo_min'); } catch (e) {}
    }
    var startMin = false;
    try {
      var saved = sessionStorage.getItem('nm_demo_min');
      // On a phone, default to minimized unless the visitor previously chose otherwise.
      startMin = saved === '1' || (saved === null && window.matchMedia && window.matchMedia('(max-width: 900px)').matches);
    } catch (e) {
      startMin = !!(window.matchMedia && window.matchMedia('(max-width: 900px)').matches);
    }
    setMin(startMin);
    panel.querySelector('[data-act=clear]').onclick = function () { save([]); render(); };
    minBtn.onclick = function () { setMin(!panel.classList.contains('min')); };
    panel.querySelector('[data-act=close]').onclick = function () {
      // Turns demo mode off for this browser session; ?demo=1 brings it back
      try { sessionStorage.removeItem('nm_demo'); sessionStorage.removeItem('nm_demo_min'); } catch (e) {}
      panel.remove(); panel = null;
      document.body.classList.remove('has-nmlog', 'nmlog-min');
    };
    render();
  }

  window.NMLog = {
    add: function (e) {
      var d = new Date();
      e.time = d.toTimeString().slice(0, 8);
      var list = entries();
      list.unshift(e);
      save(list);
      render();
    },
    entries: entries,
    enabled: enabled,
    mount: mount
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
