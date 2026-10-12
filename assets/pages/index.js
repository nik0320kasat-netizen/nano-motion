/* index.html page logic (kept out of the HTML so the Content Security Policy needs no inline-script exceptions beyond the pixel snippet) */
window.NMPage = function () {
  var ids = ['NM-RJ-01', 'NM-LG-03', 'NM-RS-05', 'NM-SH-07'];
  document.getElementById('home-grid').innerHTML = ids.map(function (id) { return NM.tile(NM.product(id)); }).join('');
};
