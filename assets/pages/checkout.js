/* checkout.html page logic (kept out of the HTML so the Content Security Policy needs no inline-script exceptions beyond the pixel snippet) */
window.NMPage = function () {
  var lines = NM.cartLines();
  if (!lines.length) { location.replace('cart.html'); return; }
  var m = NM.market();
  document.getElementById('co-country').value = m.label + ' (' + m.country + ')';
  var total = NM.cartTotal();
  document.getElementById('co-summary').innerHTML = '<strong>Order summary</strong>' +
    lines.map(function (l) {
      return '<div class="sumrow"><span>' + NM.esc(l.product.name) + ' · ' + l.size + ' × ' + l.qty + '</span><span>' + NM.format(l.total) + '</span></div>';
    }).join('') +
    '<div class="sumrow total"><span>Total</span><span>' + NM.format(total) + '</span></div>';

  NMT.checkoutStarted();

  var form = document.getElementById('co');
  form.onsubmit = async function (e) {
    e.preventDefault();
    document.getElementById('place').disabled = true;
    var f = new FormData(form);

    // 1. Matching data: normalized + hashed in the browser, then pixel re-init
    await NMT.identify({
      email: f.get('email'), phone: f.get('phone'),
      firstName: f.get('firstName'), lastName: f.get('lastName'),
      city: f.get('city'), postalCode: f.get('postalCode'), country: m.country
    });

    // 2. Create the order once. Its ID becomes the event_id (idempotency key)
    var order = {
      id: NM.newId('NM-'),
      currency: m.currency,
      total: total, // merchandise subtotal in minor units (excludes tax and shipping)
      contents: lines.map(NMT.lineToContent),
      createdAt: Date.now()
    };
    NM.saveOrder(order);
    NM.saveCart([]);
    location.href = 'confirmation.html?order=' + encodeURIComponent(order.id);
  };
};
