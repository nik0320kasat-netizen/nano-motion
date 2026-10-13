/*
 * Shared header, footer, market selector and product tile rendering.
 * Fires page_viewed once per page load.
 */
(function () {
  var NM = window.NM;

  function header() {
    var m = NM.market();
    var page = document.body.getAttribute('data-page');
    function nav(href, label, id) {
      return '<a href="' + href + '"' + (page === id ? ' aria-current="page"' : '') + '>' + label + '</a>';
    }
    var opts = Object.keys(window.NM_MARKETS).map(function (k) {
      var x = window.NM_MARKETS[k];
      return '<option value="' + k + '"' + (k === m.country ? ' selected' : '') + '>' + x.label + ' · ' + x.currency + '</option>';
    }).join('');

    var h = document.createElement('header');
    h.className = 'site-header';
    h.innerHTML =
      '<div class="announce">Free standard shipping on orders over ' + NM.format(m.freeShip) +
        ' · Free returns · Members get first access to drops</div>' +
      '<div class="bar wrap">' +
        '<button type="button" class="mobile-menu-button" id="nm-menu-button" aria-controls="nm-main-nav" aria-expanded="false" aria-label="Open menu"><span aria-hidden="true">☰</span></button>' +
        '<a class="logo" href="index.html" aria-label="Nano Motion home"><span class="logo-mark"></span>NANO MOTION</a>' +
        '<nav class="nav" id="nm-main-nav" aria-label="Main navigation">' +
          nav('shop.html', 'Shop', 'shop') +
          nav('fit-finder.html', 'Fit Finder', 'fit-finder') +
          nav('membership.html', 'Club', 'membership') +
          nav('account.html', 'Account', 'account') +
        '</nav>' +
        '<div class="bar-right">' +
          '<label class="market"><span class="sr">Market</span><select id="nm-market">' + opts + '</select></label>' +
          '<a class="cart-link" href="cart.html">Bag <span id="nm-cart-count">0</span></a>' +
        '</div>' +
      '</div>';
    document.body.insertBefore(h, document.body.firstChild);

    var menuButton = document.getElementById('nm-menu-button');
    var mainNav = document.getElementById('nm-main-nav');
    function closeMenu() {
      mainNav.classList.remove('is-open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Open menu');
      menuButton.querySelector('span').textContent = '☰';
    }
    menuButton.addEventListener('click', function () {
      var open = mainNav.classList.toggle('is-open');
      menuButton.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menuButton.querySelector('span').textContent = open ? '×' : '☰';
    });
    mainNav.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeMenu(); menuButton.focus(); }
    });
    menuButton.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });

    document.getElementById('nm-market').addEventListener('change', function (e) {
      var next = window.NM_MARKETS[e.target.value];
      // Recorded under the current market's consent, before switching
      window.NMT.marketSelected(next.currency);
      NM.setMarket(next.country);
      setTimeout(function () { location.reload(); }, 250);
    });
  }

  function footer() {
    var m = NM.market();
    var f = document.createElement('footer');
    f.className = 'site-footer';
    var choice = '<a href="#" id="nm-privacy-choices">Your Privacy Choices</a>';
    f.innerHTML =
      '<div class="wrap foot-grid">' +
        '<div><div class="logo small"><span class="logo-mark"></span>NANO MOTION</div>' +
        '<p class="muted">Premium performance apparel, tested by people who train every day.</p></div>' +
        '<div><h2 class="foot-h">Shop</h2><a href="shop.html">All products</a><a href="fit-finder.html">Fit Finder</a><a href="membership.html">Nano Motion Club</a></div>' +
        '<div><h2 class="foot-h">Help</h2><a href="privacy.html">Privacy notice</a>' + choice + '<a href="https://github.com/nik0320kasat-netizen/nano-motion#readme" target="_blank" rel="noopener">Measurement plan and source code</a></div>' +
      '</div>' +
      '<div class="wrap foot-note">Demo store for an OpenAI Ads measurement exercise. No real products, payments or orders. ' +
      'Add <code>?demo=1</code> to any URL to see the pixel event log.</div>';
    document.body.appendChild(f);

    var c = document.getElementById('nm-privacy-choices');
    if (c) c.addEventListener('click', function (e) { e.preventDefault(); window.NMConsent.showSettings(); });
  }

  NM.renderCartCount = function () {
    var el = document.getElementById('nm-cart-count');
    if (el) el.textContent = NM.cart().reduce(function (s, l) { return s + l.qty; }, 0);
  };

  // Product imagery: original flat illustrations, no brand assets
  NM.art = function (p) {
    var shapes = {
      Running: '<path d="M60 40 L100 30 L140 40 L150 120 L130 125 L128 80 L128 170 L72 170 L72 80 L70 125 L50 120 Z"/>',
      Training: '<path d="M55 45 L85 35 Q100 48 115 35 L145 45 L155 85 L135 90 L135 165 L65 165 L65 90 L45 85 Z"/>',
      Yoga: '<path d="M75 30 L125 30 L130 90 L118 175 L104 175 L100 95 L96 175 L82 175 L70 90 Z"/>',
      Outerwear: '<path d="M60 38 L100 28 L140 38 L158 130 L136 134 L134 90 L134 175 L66 175 L66 90 L64 134 L42 130 Z M100 28 L100 175"/>',
      Accessories: '<rect x="55" y="60" width="90" height="90" rx="14"/>'
    };
    var shape = shapes[p.category] || shapes.Accessories;
    return '<svg class="art" viewBox="0 0 200 200" role="img" aria-label="' + NM.esc(p.name) + '">' +
      '<rect width="200" height="200" fill="var(--tile)"/>' +
      '<g fill="' + p.tone + '" stroke="rgba(0,0,0,.12)" stroke-width="1.5">' + shape + '</g></svg>';
  };

  NM.stars = function (r) {
    return '<span class="stars" aria-label="' + r + ' out of 5">' + '★★★★★'.slice(0, Math.round(r)) +
      '<span class="dim">' + '★★★★★'.slice(Math.round(r)) + '</span></span>';
  };

  NM.tile = function (p) {
    return '<a class="tile" href="product.html?id=' + p.id + '">' +
      '<div class="tile-img">' + NM.art(p) + (p.badge ? '<span class="badge">' + p.badge + '</span>' : '') + '</div>' +
      '<div class="tile-meta"><span>' + NM.esc(p.name) + '</span><span>' + NM.format(NM.price(p)) + '</span></div>' +
      '<div class="tile-sub">' + NM.esc(p.color) + ' · ' + NM.stars(p.rating) + ' <span class="muted">(' + p.reviews.toLocaleString() + ')</span></div>' +
    '</a>';
  };

  function init() {
    header();
    footer();
    NM.renderCartCount();
    window.NMT.pageView();
    if (window.NMPage) window.NMPage();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
