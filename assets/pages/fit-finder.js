/* fit-finder.html page logic (kept out of the HTML so the Content Security Policy needs no inline-script exceptions beyond the pixel snippet) */
window.NMPage = function () {
  var root = document.getElementById('ff');
  var answers = {};
  var started = false;
  var steps = [
    { key: 'train', q: 'How do you train?', sub: 'We will build your kit around it.', opts: [
      ['Running', 'Road, trail, track'], ['Lifting', 'Strength and power'], ['Hybrid', 'A bit of everything'], ['Yoga', 'Flow, pilates, mobility']] },
    { key: 'fit', q: 'How do you like your gear to fit?', sub: 'There is no wrong answer.', opts: [
      ['Snug', 'Close to the body, nothing moves'], ['Relaxed', 'Room to breathe and layer']] },
    { key: 'size', q: 'What size do you usually wear?', sub: 'In other premium activewear brands.', opts: [
      ['XS', ''], ['S', ''], ['M', ''], ['L', ''], ['XL', '']] }
  ];
  var kits = {
    Running: ['NM-RJ-01', 'NM-RS-05', 'NM-SK-02'],
    Lifting: ['NM-TS-04', 'NM-RS-05', 'NM-SK-02'],
    Hybrid:  ['NM-TS-04', 'NM-RS-05', 'NM-RJ-01'],
    Yoga:    ['NM-LG-03', 'NM-BR-06', 'NM-MT-08']
  };
  var order = ['XS', 'S', 'M', 'L', 'XL'];

  function sizeFor(p) {
    if (p.sizes.length === 1) return p.sizes[0];
    var s = answers.size;
    // Relaxed preference on a compressive item: size up one
    if (answers.fit === 'Relaxed' && p.fitMeter < 40) s = order[Math.min(order.indexOf(s) + 1, order.length - 1)];
    if (p.sizes.indexOf(s) === -1) s = p.sizes[Math.min(order.indexOf(s), p.sizes.length - 1)] || p.sizes[0];
    // Never recommend a sold-out size: take the nearest available one, preferring a size up
    if (p.soldOut.indexOf(s) !== -1) {
      var avail = p.sizes.filter(function (x) { return p.soldOut.indexOf(x) === -1; });
      var i = order.indexOf(s);
      avail.sort(function (a, b) {
        var da = Math.abs(order.indexOf(a) - i), db = Math.abs(order.indexOf(b) - i);
        return da - db || order.indexOf(b) - order.indexOf(a);
      });
      s = avail[0];
    }
    return s;
  }

  function step(i) {
    var st = steps[i];
    root.innerHTML =
      '<div class="ff-progress">' + steps.map(function (_, j) { return '<span class="' + (j <= i ? 'on' : '') + '"></span>'; }).join('') + '</div>' +
      '<span class="eyebrow">Fit Finder · ' + (i + 1) + ' of ' + steps.length + '</span>' +
      '<h1 style="font-size:2.4rem">' + st.q + '</h1><p class="muted">' + st.sub + '</p>' +
      '<div class="choices">' + st.opts.map(function (o) {
        return '<button type="button" class="choice" data-v="' + o[0] + '"><strong>' + o[0] + '</strong>' + (o[1] ? '<span>' + o[1] + '</span>' : '') + '</button>';
      }).join('') + '</div>';
    root.querySelectorAll('.choice').forEach(function (b) {
      b.onclick = function () {
        answers[st.key] = b.getAttribute('data-v');
        if (!started) { started = true; NMT.fitFinderStarted(); }   // first answer = the quiz has started
        if (i + 1 < steps.length) step(i + 1); else result();
      };
    });
  }

  function result() {
    var items = kits[answers.train].map(function (id) { var p = NM.product(id); return { product: p, size: sizeFor(p) }; });
    NMT.fitFinderCompleted(items.map(function (it) {
      return { id: NM.variantId(it.product, it.size), name: NM.variantName(it.product, it.size), content_type: 'product' };
    }));
    root.innerHTML =
      '<div class="ff-progress">' + steps.map(function () { return '<span class="on"></span>'; }).join('') + '</div>' +
      '<span class="eyebrow">Your ' + answers.train.toLowerCase() + ' kit</span>' +
      '<h1 style="font-size:2.4rem">Here is what we would wear.</h1>' +
      '<p class="muted">Sizes are preselected for a ' + answers.fit.toLowerCase() + ' fit.</p>' +
      '<div class="grid" style="grid-template-columns:repeat(3,1fr);margin-top:20px">' + items.map(function (it) {
        return NM.tile(it.product).replace('product.html?id=' + it.product.id, 'product.html?id=' + it.product.id + '&size=' + it.size) +
          '<p class="note">Recommended size: <strong>' + it.size + '</strong></p>';
      }).map(function (h) { return '<div>' + h + '</div>'; }).join('') + '</div>' +
      '<div class="cta-row"><button class="btn btn-ghost" id="restart">Start over</button></div>';
    document.getElementById('restart').onclick = function () { answers = {}; started = false; step(0); };
  }

  step(0);
};
