/* account.html page logic (kept out of the HTML so the Content Security Policy needs no inline-script exceptions beyond the pixel snippet) */
window.NMPage = function () {
  var root = document.getElementById('acct');
  var acct = NM.read('nm_account', null);
  function render() {
    if (acct) {
      root.innerHTML = '<span class="eyebrow">Account</span><h1 style="font-size:2.2rem">You are signed in.</h1>' +
        '<p class="muted">Account ' + NM.esc(acct.id) + '. Club membership is separate: <a href="membership.html">see the Club</a>.</p>' +
        '<button class="btn btn-ghost" id="out">Sign out (reset demo)</button>';
      document.getElementById('out').onclick = function () { NM.write('nm_account', null); acct = null; render(); };
      return;
    }
    root.innerHTML = '<span class="eyebrow">Account</span><h1 style="font-size:2.2rem">Create your account</h1>' +
      '<p class="muted">Save your sizes, track orders, and check out faster.</p>' +
      '<form id="su"><div class="row2"><label class="field">First name<input name="firstName" required autocomplete="given-name"></label>' +
      '<label class="field">Last name<input name="lastName" required autocomplete="family-name"></label></div>' +
      '<label class="field">Email<input name="email" type="email" required autocomplete="email"></label>' +
      '<label class="field">Password<input type="password" required minlength="8" autocomplete="new-password"></label>' +
      '<button class="btn btn-block">Create account</button>' +
      '<p class="note">Creating an account does not join the Club. Demo only: nothing is stored on a server.</p></form>';
    var form = document.getElementById('su');
    form.onsubmit = async function (e) {
      e.preventDefault();
      var f = new FormData(form);
      await NMT.identify({ email: f.get('email'), firstName: f.get('firstName'), lastName: f.get('lastName'), country: NM.market().country });
      acct = { id: NM.newId('acct_') };
      NM.write('nm_account', acct);
      NMT.registrationCompleted(acct.id);
      render();
    };
  }
  render();
};
