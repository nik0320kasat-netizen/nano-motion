/* cart.html page logic (kept out of the HTML so the Content Security Policy needs no inline-script exceptions beyond the pixel snippet) */
window.NMPage = function () {
  var root = document.getElementById('cart');
  function render() {
    var lines = NM.cartLines();
    var m = NM.market();
    if (!lines.length) {
      root.innerHTML = '<div class="empty"><h1 style="font-size:2.2rem">Your bag is empty.</h1><p class="muted">Not sure where to start?</p>' +
        '<div class="cta-row" style="justify-content:center"><a class="btn" href="shop.html">Shop all</a><a class="btn btn-ghost" href="fit-finder.html">Try the Fit Finder</a></div></div>';
      return;
    }
    var total = NM.cartTotal();
    var left = Math.max(0, m.freeShip - total);
    var pct = Math.min(100, Math.round(total / m.freeShip * 100));
    root.innerHTML =
      '<div class="two-col"><div><h1 style="font-size:2.2rem">Your bag</h1>' +
      lines.map(function (l, i) {
        return '<div class="line"><div class="tile-img">' + NM.art(l.product) + '</div>' +
          '<div><strong>' + NM.esc(l.product.name) + '</strong><div class="muted">' + NM.esc(l.product.color) + ' · ' + l.size + '</div>' +
          '<div class="qty"><button type="button" data-i="' + i + '" data-d="-1" aria-label="Decrease">−</button><span>' + l.qty + '</span>' +
          '<button type="button" data-i="' + i + '" data-d="1" aria-label="Increase">+</button></div></div>' +
          '<div>' + NM.format(l.total) + '</div></div>';
      }).join('') + '</div>' +
      '<aside class="summary"><strong>' + (left ? 'You are ' + NM.format(left) + ' from free shipping' : 'Free shipping unlocked') + '</strong>' +
        '<div class="shipbar"><span style="width:' + pct + '%"></span></div>' +
        '<div class="sumrow"><span>Subtotal</span><span>' + NM.format(total) + '</span></div>' +
        '<div class="sumrow"><span>Shipping</span><span>' + (left ? 'Calculated at checkout' : 'Free') + '</span></div>' +
        '<div class="sumrow total"><span>Total</span><span>' + NM.format(total) + '</span></div>' +
        '<a class="btn btn-block" href="checkout.html" style="margin-top:14px">Checkout</a>' +
        '<p class="note">Prices in ' + m.currency + ' for ' + NM.esc(m.label) + '.</p></aside></div>';

    root.querySelectorAll('.qty button').forEach(function (b) {
      b.onclick = function () {
        var c = NM.cart(); var i = +b.getAttribute('data-i');
        c[i].qty += +b.getAttribute('data-d');
        if (c[i].qty <= 0) c.splice(i, 1);
        NM.saveCart(c); render();
      };
    });
  }
  render();
};
