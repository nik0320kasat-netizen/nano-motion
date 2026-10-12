/*
 * tracking.js — the ONLY file on the site that calls the OpenAI Pixel (oaiq).
 *
 * Every page calls NMT.* instead of oaiq directly, so one place owns:
 *   - consent gating (nothing is sent while consent is denied)
 *   - integer minor-unit amounts and currency on every value event
 *   - contents[] built from cart lines with variant-level IDs
 *   - event IDs and fire-once guards for conversions (idempotency)
 *   - identifier normalization + SHA-256 hashing in the browser
 *   - a local log of every call, shown in the demo panel (?demo=1)
 *
 * The same functions are where a Conversions API hand-off would be added later,
 * reusing the same event IDs so OpenAI deduplicates browser and server events.
 */
(function () {
  var NM = window.NM;
  var PIXEL_ID = '1GtqyL7Rgr4qk4pR3LFbss';
  var DEBUG = true; // demo only: lets reviewers see SDK activity in the Console. Off in production.

  var STANDARD = [
    'page_viewed', 'contents_viewed', 'items_added', 'checkout_started', 'order_created',
    'registration_completed', 'subscription_created', 'trial_started'
  ];

  function log(entry) { if (window.NMLog) window.NMLog.add(entry); }

  function oaiqAvailable() { return typeof window.oaiq === 'function'; }

  // ---- contents[] -------------------------------------------------------------
  // Item amount = unit price in minor units; quantity is an integer.
  // Only fields the Pixel accepts: id, name, content_type, quantity, amount, currency.
  function lineToContent(line) {
    return {
      id: NM.variantId(line.product, line.size),
      name: NM.variantName(line.product, line.size),
      content_type: 'product',
      quantity: line.qty,
      amount: line.unit
    };
  }

  // ---- Core send ----------------------------------------------------------------
  function send(eventName, data, options) {
    var isCustom = STANDARD.indexOf(eventName) === -1;
    var label = isCustom ? 'custom: ' + eventName : eventName;

    if (!NM.consentGranted()) {
      log({ event: label, status: 'held', note: 'no consent, not sent', data: data, options: options || null });
      return false;
    }
    if (!oaiqAvailable()) {
      log({ event: label, status: 'error', note: 'pixel not installed', data: data });
      return false;
    }

    if (isCustom) {
      var opts = Object.assign({ custom_event_name: eventName }, options || {});
      window.oaiq('measure', 'custom', data, opts);
      log({ event: label, status: 'sent', data: data, options: opts });
    } else if (options) {
      window.oaiq('measure', eventName, data, options);
      log({ event: label, status: 'sent', data: data, options: options });
    } else {
      window.oaiq('measure', eventName, data);
      log({ event: label, status: 'sent', data: data });
    }
    return true;
  }

  // Fire-once guard for conversions. The stable business ID is the real
  // idempotency key (event_id); this guard just avoids re-sending on refresh.
  function sendOnce(eventName, data, id) {
    var key = eventName + ':' + id;
    var sent = NM.read('nm_sent', []);
    if (sent.indexOf(key) !== -1) {
      log({ event: eventName, status: 'skipped', note: 'already sent (event_id ' + id + ')' });
      return false;
    }
    var ok = send(eventName, data, { event_id: id });
    if (ok) { sent.push(key); NM.write('nm_sent', sent.slice(-200)); } // bounded memory
    return ok;
  }

  // ---- Identity: normalize, hash, re-init -----------------------------------------
  function normEmail(v) { return String(v).trim().toLowerCase(); }

  // Phone: the hash only matches if the country code is present. Shoppers usually
  // type national numbers (415 555 2671, 07911 123456), so we add the market's
  // calling code when the number is not already international (+ or 00 prefix).
  var CALLING_CODE = { US: '1', GB: '44', DE: '49', JP: '81' };
  function normPhone(v, country) {
    var raw = String(v).trim();
    var intl = /^(\+|00)/.test(raw);
    var d = raw.replace(/\D/g, '');
    var cc = CALLING_CODE[country];
    if (intl) d = d.replace(/^0+/, '');                                  // +44… or 0044…
    else if (cc === '1' && d.length === 10) d = '1' + d;                 // US national format
    else if (cc && cc !== '1' && /^0/.test(d)) d = cc + d.replace(/^0+/, ''); // drop trunk 0, add code
    else d = d.replace(/^0+/, '');
    return /^\d{8,15}$/.test(d) ? d : null;
  }
  function normName(v) {
    // lowercase; remove whitespace and ASCII punctuation; keep accents and other non-ASCII
    return String(v).toLowerCase().replace(/[\s!-\/:-@\[-`{-~]/g, '');
  }

  async function sha256(value) {
    var bytes = new TextEncoder().encode(value);
    var hash = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(hash)).map(function (b) {
      return b.toString(16).padStart(2, '0');
    }).join('');
  }

  function maskEmail(e) {
    var parts = normEmail(e).split('@');
    return parts[0].charAt(0) + '***@' + (parts[1] || '');
  }

  // Never throws: a hashing failure (no secure context, old browser) must not block a checkout.
  async function identify(raw) {
    // No consent: identifiers are neither hashed, stored nor sent.
    if (!NM.consentGranted()) {
      log({ event: 'init (user data)', status: 'held', note: 'no consent: not hashed, stored or sent' });
      return null;
    }
    var user = NM.read('nm_user', {});
    var shown = {};
    try {
      var phone = raw.phone ? normPhone(raw.phone, raw.country) : null;
      if (raw.email) { user.email_sha256 = await sha256(normEmail(raw.email)); shown.email = maskEmail(raw.email); }
      if (phone)     { user.phone_number_sha256 = await sha256(phone); shown.phone = '***'; }
      if (raw.firstName && normName(raw.firstName)) user.first_name_sha256 = await sha256(normName(raw.firstName));
      if (raw.lastName && normName(raw.lastName))   user.last_name_sha256 = await sha256(normName(raw.lastName));
    } catch (e) {
      log({ event: 'init (user data)', status: 'error', note: 'hashing unavailable, identifiers skipped' });
      return null;
    }
    // Geography is sent raw, per the docs
    if (raw.country) user.country = raw.country;
    if (raw.city) user.city = String(raw.city).trim();
    if (raw.postalCode) user.postal_code = String(raw.postalCode).trim();

    NM.write('nm_user', user); // hashes only; raw values are never stored

    if (oaiqAvailable()) window.oaiq('init', { pixelId: PIXEL_ID, debug: DEBUG, user: user });
    log({ event: 'init (user data)', status: 'sent', note: 'hashed in browser', data: { user: user }, shown: shown });
    return user;
  }

  // ---- Public API --------------------------------------------------------------------
  window.NMT = {
    PIXEL_ID: PIXEL_ID,
    normEmail: normEmail, normPhone: normPhone, normName: normName, sha256: sha256,
    identify: identify,

    pageView: function () {
      var page = document.body.getAttribute('data-page') || location.pathname;
      send('page_viewed', {
        type: 'contents',
        contents: [{ id: page, name: document.title, content_type: 'page' }]
      });
    },

    productView: function (p) {
      // Style-level ID before a size is chosen
      send('contents_viewed', {
        type: 'contents',
        contents: [{ id: p.id, name: p.name + ' (' + p.color + ')', content_type: 'product' }]
      });
    },

    // lines: [{product, size, qty, unit}] — one call per add, kits send several lines at once
    itemsAdded: function (lines) {
      var contents = lines.map(lineToContent);
      var amount = lines.reduce(function (s, l) { return s + l.unit * l.qty; }, 0);
      send('items_added', { type: 'contents', amount: amount, currency: NM.market().currency, contents: contents });
    },

    checkoutStarted: function () {
      var lines = NM.cartLines();
      if (!lines.length) return;
      send('checkout_started', {
        type: 'contents', amount: NM.cartTotal(), currency: NM.market().currency,
        contents: lines.map(lineToContent)
      });
    },

    orderCreated: function (order) {
      sendOnce('order_created', {
        type: 'contents', amount: order.total, currency: order.currency, contents: order.contents
      }, order.id);
    },

    registrationCompleted: function (accountId) {
      sendOnce('registration_completed', { type: 'customer_action' }, accountId);
    },

    trialStarted: function (planId, trialId) {
      sendOnce('trial_started', { type: 'plan_enrollment', plan_id: planId }, trialId);
    },

    subscriptionCreated: function (planId, amount, currency, subId) {
      sendOnce('subscription_created', {
        type: 'plan_enrollment', plan_id: planId, amount: amount, currency: currency
      }, subId);
    },

    // ---- Tier 3: custom insight events (reporting only, never optimization goals)
    fitFinderStarted: function () {
      send('fit_finder_started', { type: 'custom' });
    },
    fitFinderCompleted: function (contents) {
      send('fit_finder_completed', { type: 'custom', contents: contents });
    },
    backInStockSignup: function (p, size) {
      send('back_in_stock_signup', {
        type: 'custom',
        contents: [{ id: NM.variantId(p, size), name: NM.variantName(p, size), content_type: 'product' }]
      });
    },
    marketSelected: function (currency) {
      send('market_selected', { type: 'custom', currency: currency });
    },

    lineToContent: lineToContent
  };
})();
