/* shop.html page logic (kept out of the HTML so the Content Security Policy needs no inline-script exceptions beyond the pixel snippet) */
window.NMPage = function () {
  var cats = ['All', 'Running', 'Training', 'Yoga', 'Outerwear', 'Accessories'];
  var active = 'All';
  var chips = document.getElementById('chips');
  function render() {
    var list = window.NM_PRODUCTS.filter(function (p) { return active === 'All' || p.category === active; });
    document.getElementById('shop-grid').innerHTML = list.map(NM.tile).join('');
    document.getElementById('shop-count').textContent = list.length + ' products';
    chips.innerHTML = cats.map(function (c) {
      return '<button class="chip" type="button" aria-pressed="' + (c === active) + '" data-c="' + c + '">' + c + '</button>';
    }).join('');
    chips.querySelectorAll('.chip').forEach(function (b) {
      b.onclick = function () { active = b.getAttribute('data-c'); render(); };
    });
  }
  render();
};
