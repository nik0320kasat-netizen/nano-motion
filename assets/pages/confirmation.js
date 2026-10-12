/* confirmation.html page logic (kept out of the HTML so the Content Security Policy needs no inline-script exceptions beyond the pixel snippet) */
window.NMPage = function () {
  var root = document.getElementById('conf');
  var order = NM.order(NM.param('order'));
  if (!order) {
    root.innerHTML = '<h1 style="font-size:2rem">We could not find that order.</h1><a class="btn" href="shop.html">Keep shopping</a>';
    return;
  }
  var mk = Object.keys(window.NM_MARKETS).map(function (k) { return window.NM_MARKETS[k]; })
    .filter(function (x) { return x.currency === order.currency; })[0];

  // Purchase conversion. event_id = order ID; a refresh is skipped, and a
  // future server-side send with the same ID is deduplicated by OpenAI.
  NMT.orderCreated(order);

  root.innerHTML =
    '<span class="eyebrow">Order ' + NM.esc(order.id) + '</span>' +
    '<h1 style="font-size:2.6rem">Thank you. Your order is in.</h1>' +
    '<p class="muted">A confirmation would be on its way to your inbox. (Demo store: nothing ships.)</p>' +
    '<div class="ordercard">' + order.contents.map(function (c) {
      return '<div class="sumrow" style="display:flex;justify-content:space-between;margin:6px 0"><span>' + NM.esc(c.name) + ' × ' + c.quantity + '</span><span>' + NM.format(c.amount * c.quantity, mk) + '</span></div>';
    }).join('') +
    '<div style="display:flex;justify-content:space-between;font-weight:700;border-top:1px solid var(--line);padding-top:10px;margin-top:10px"><span>Total</span><span>' + NM.format(order.total, mk) + '</span></div></div>' +
    '<div class="cta-row" style="justify-content:center"><a class="btn" href="membership.html">Members get free hemming: join the Club</a><a class="btn btn-ghost" href="shop.html">Keep shopping</a></div>';
};
