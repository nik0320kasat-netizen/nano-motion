/* product.html page logic (kept out of the HTML so the Content Security Policy needs no inline-script exceptions beyond the pixel snippet) */
window.NMPage = function () {
  var p = NM.product(NM.param('id')) || window.NM_PRODUCTS[0];
  document.title = p.name + ' | Nano Motion';
  var selected = NM.param('size');
  if (p.sizes.length === 1) selected = p.sizes[0];
  if (selected && (p.sizes.indexOf(selected) === -1 || p.soldOut.indexOf(selected) !== -1)) selected = null;

  var root = document.getElementById('pdp');
  var kitItems = p.kit.map(NM.product);

  // Kit items follow the chosen size. If that size is sold out for a kit item, the item is
  // skipped rather than silently swapped for another size (returns null).
  function kitSize(k) {
    if (k.sizes.length === 1) return k.sizes[0];
    var s = selected && k.sizes.indexOf(selected) !== -1 ? selected : 'M';
    return k.soldOut.indexOf(s) === -1 ? s : null;
  }

  function render(bisFor) {
    var sizes = p.sizes.map(function (s) {
      var out = p.soldOut.indexOf(s) !== -1;
      return '<button type="button" class="size' + (out ? ' out' : '') + '" data-s="' + s + '" aria-pressed="' + (s === selected) + '"' +
        (out ? ' aria-label="' + s + ', sold out"' : '') + '>' + s + '</button>';
    }).join('');

    root.innerHTML =
      '<div class="pdp-img">' + NM.art(p) + (p.badge ? '<span class="badge">' + p.badge + '</span>' : '') + '</div>' +
      '<div>' +
        '<span class="eyebrow">' + NM.esc(p.category) + '</span>' +
        '<h1>' + NM.esc(p.name) + '</h1>' +
        '<div class="price">' + NM.format(NM.price(p)) + '</div>' +
        '<div class="rating-line">' + NM.stars(p.rating) + ' <span>' + p.rating + ' · ' + p.reviews.toLocaleString() + ' reviews</span></div>' +
        '<p>' + NM.esc(p.blurb) + '</p>' +
        '<div class="fitbox"><strong>Fit: ' + NM.esc(p.fit) + '</strong>' +
          '<div class="fitmeter"><span style="left:' + p.fitMeter + '%"></span></div>' +
          '<div class="fitscale"><span>Runs small</span><span>True to size</span><span>Runs big</span></div>' +
          '<div class="note" style="margin-top:8px">' + NM.esc(p.model) + ' · based on ' + p.reviews.toLocaleString() + ' reviews</div></div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center"><strong>Color: ' + NM.esc(p.color) + '</strong>' +
          '<button class="linkbtn" type="button" id="sg-open">Size guide</button></div>' +
        '<div class="sizes" role="group" aria-label="Size">' + sizes + '</div>' +
        (bisFor ? '<div class="bis" id="bis"><strong>Size ' + bisFor + ' is sold out.</strong> Get an email when it is back.' +
          '<form id="bis-form"><input type="email" required placeholder="Email address" autocomplete="email"><button class="btn">Notify me</button></form></div>' : '') +
        '<button class="btn btn-block" id="add" ' + (selected ? '' : 'disabled') + '>' + (selected ? 'Add to bag · ' + NM.format(NM.price(p)) : 'Select a size') + '</button>' +
        '<p class="note" style="margin-top:8px">Free returns. Members get free hemming. <a href="fit-finder.html">Not sure? Try the Fit Finder</a>.</p>' +
        '<div class="reviewsum"><strong>What reviewers say</strong> <span class="note">Summarized from ' + p.reviews.toLocaleString() + ' reviews</span>' +
          '<ul>' + p.highlights.map(function (h) { return '<li>' + NM.esc(h) + '</li>'; }).join('') + '</ul></div>' +
        '<div class="kit"><strong>Complete the kit</strong>' +
          '<div class="kit-items">' + [p].concat(kitItems).map(function (k) {
            return '<div><div class="tile-img">' + NM.art(k) + '</div><small>' + NM.esc(k.name) + '<br>' + NM.format(NM.price(k)) + '</small></div>';
          }).join('') + '</div>' +
          '<button class="btn btn-ghost btn-block" id="addkit" ' + (selected ? '' : 'disabled') + '>' +
            (selected ? 'Add all three · ' + NM.format(NM.price(p) + kitItems.reduce(function (s, k) { return s + NM.price(k); }, 0)) : 'Select a size to add the kit') +
          '</button></div>' +
      '</div>';

    root.querySelectorAll('.size').forEach(function (b) {
      b.onclick = function () {
        var s = b.getAttribute('data-s');
        if (p.soldOut.indexOf(s) !== -1) { render(s); document.querySelector('#bis input').focus(); return; }
        selected = s; render();
      };
    });
    document.getElementById('sg-open').onclick = function () { document.getElementById('sizeguide').showModal(); };

    var bis = document.getElementById('bis-form');
    if (bis) bis.onsubmit = async function (e) {
      e.preventDefault();
      var email = bis.querySelector('input').value;
      await NMT.identify({ email: email, country: NM.market().country });
      NMT.backInStockSignup(p, bisFor);
      document.getElementById('bis').innerHTML = '<strong>You are on the list.</strong> We will email you when size ' + bisFor + ' is back.';
    };

    var add = document.getElementById('add');
    add.onclick = function () {
      NM.addToCart(p.id, selected, 1);
      NMT.itemsAdded([{ product: p, size: selected, qty: 1, unit: NM.price(p) }]);
      toast('Added ' + p.name + ', ' + selected + ' to your bag');
    };

    document.getElementById('addkit').onclick = function () {
      var skipped = [];
      var lines = [{ product: p, size: selected, qty: 1, unit: NM.price(p) }].concat(kitItems.map(function (k) {
        var s = kitSize(k);
        if (!s) { skipped.push(k.name + ' in ' + selected); return null; }
        return { product: k, size: s, qty: 1, unit: NM.price(k) };
      }).filter(Boolean));
      lines.forEach(function (l) { NM.addToCart(l.product.id, l.size, 1); });
      NMT.itemsAdded(lines); // one event, only the items actually added, in contents[]
      toast(skipped.length ? 'Added ' + lines.length + ' items. ' + skipped.join(', ') + ' is sold out' : 'Added the kit to your bag');
    };
  }

  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'toast'; t.innerHTML = NM.esc(msg) + ' · <a href="cart.html" style="color:#fff">View bag</a>';
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2600);
  }

  render();
  NMT.productView(p);
};
