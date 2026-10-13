/*
 * Browser state for the demo store. No backend: cart, market, consent and
 * orders live in localStorage. Only hashed identifiers are ever stored.
 */
(function () {
  function read(key, fallback) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch (e) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage blocked */ }
  }

  var NM = window.NM = window.NM || {};

  NM.read = read;
  NM.write = write;

  // ---- Market -------------------------------------------------------------
  NM.market = function () {
    var m = read('nm_market', { country: 'US' });
    return window.NM_MARKETS[m.country] || window.NM_MARKETS.US;
  };
  NM.setMarket = function (country) { write('nm_market', { country: country }); };

  // ---- Advertising measurement consent and GPC ------------------------
  NM.consentState = function () {
    try { return localStorage.getItem('nm_consent') || 'unset'; } catch (e) { return 'unset'; }
  };
  NM.setConsent = function (state) {
    try { localStorage.setItem('nm_consent', state); } catch (e) {}
  };
  // Global Privacy Control: a browser-level opt-out signal that CCPA and several
  // other US states require sites to honor. Treated like an opt-in market: nothing
  // sends unless the visitor explicitly grants consent on this site.
  NM.gpc = function () { return navigator.globalPrivacyControl === true; };
  NM.consentGranted = function () {
    if (NM.gpc()) return false; // browser opt-out cannot be overridden by site consent
    if (!NM.market().optIn) return NM.consentState() !== 'denied';
    return NM.consentState() === 'granted';
  };

  // ---- Catalog helpers ------------------------------------------------------
  NM.product = function (id) {
    return window.NM_PRODUCTS.filter(function (p) { return p.id === id; })[0] || null;
  };
  // Variant ID = style + color + size, e.g. NM-RJ-01-BLK-M
  NM.variantId = function (p, size) { return p.id + '-' + p.colorCode + '-' + size; };
  NM.variantName = function (p, size) { return p.name + ' (' + p.color + ', ' + size + ')'; };
  NM.price = function (p) { return p.price[NM.market().currency]; };

  NM.format = function (minor, market) {
    var m = market || NM.market();
    var major = minor / Math.pow(10, m.decimals);
    return new Intl.NumberFormat(m.locale, {
      style: 'currency', currency: m.currency,
      minimumFractionDigits: m.decimals, maximumFractionDigits: m.decimals
    }).format(major);
  };

  // ---- Cart ------------------------------------------------------------------
  NM.cart = function () { return read('nm_cart', []); };
  NM.saveCart = function (c) { write('nm_cart', c); NM.renderCartCount && NM.renderCartCount(); };
  NM.addToCart = function (productId, size, qty) {
    var c = NM.cart();
    var line = c.filter(function (l) { return l.id === productId && l.size === size; })[0];
    if (line) line.qty += qty; else c.push({ id: productId, size: size, qty: qty });
    NM.saveCart(c);
  };
  NM.cartLines = function () {
    return NM.cart().map(function (l) {
      var p = NM.product(l.id);
      return { product: p, size: l.size, qty: l.qty, unit: NM.price(p), total: NM.price(p) * l.qty };
    }).filter(function (l) { return l.product; });
  };
  NM.cartTotal = function () {
    return NM.cartLines().reduce(function (s, l) { return s + l.total; }, 0);
  };

  // ---- Orders and IDs ---------------------------------------------------------
  // The ID doubles as the pixel event_id, and OpenAI dedupes on Pixel ID + event + ID
  // across ALL shoppers, so two orders must never share one. In production the order
  // system issues it; this demo makes a collision-resistant one: time + random,
  // e.g. NM-MGN4X2Q1-7F3A9C21.
  NM.newId = function (prefix) {
    var r = '';
    try {
      var a = new Uint8Array(4); crypto.getRandomValues(a);
      r = Array.from(a).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    } catch (e) { r = Math.random().toString(16).slice(2, 10); }
    return prefix + Date.now().toString(36).toUpperCase() + '-' + r.toUpperCase();
  };
  NM.saveOrder = function (order) {
    var orders = read('nm_orders', {});
    orders[order.id] = order;
    write('nm_orders', orders);
  };
  NM.order = function (id) { return read('nm_orders', {})[id] || null; };

  // ---- Page helpers ----------------------------------------------------------
  NM.param = function (name) { return new URLSearchParams(location.search).get(name); };
  NM.esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
})();
