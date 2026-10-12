/* membership.html page logic (kept out of the HTML so the Content Security Policy needs no inline-script exceptions beyond the pixel snippet) */
window.NMPage = function () {
  var root = document.getElementById('plans');
  var m = NM.market();
  var monthly = window.NM_PLANS.club_monthly;
  var member = NM.read('nm_member', null);

  function planCard(kind) {
    var isTrial = kind === 'trial';
    return '<div class="plan' + (isTrial ? ' feature' : '') + '">' +
      '<span class="eyebrow">' + (isTrial ? 'Start here' : 'Full membership') + '</span>' +
      '<h2>' + (isTrial ? 'Free for 30 days' : NM.format(monthly.price[m.currency]) + ' / month') + '</h2>' +
      '<ul>' + (isTrial
        ? '<li>Every Club perk for 30 days</li><li>No card required to start</li><li>Cancel any time</li>'
        : '<li>Every Club perk</li><li>Member-only drops and colorways</li><li>Billed monthly in ' + m.currency + '</li>') + '</ul>' +
      '<form data-kind="' + kind + '"><label class="field">Email<input type="email" required autocomplete="email"></label>' +
      '<button class="btn btn-block' + (isTrial ? '' : ' btn-ghost') + '">' + (isTrial ? 'Start free trial' : 'Join monthly') + '</button></form></div>';
  }

  function render() {
    if (member) {
      root.innerHTML = '<div class="plan feature" style="grid-column:1/-1"><span class="eyebrow">You are in</span>' +
        '<h2>Welcome to the Club.</h2><p>' + (member.kind === 'trial' ? 'Your 30-day free trial is active.' : 'Your monthly membership is active.') +
        ' Reference ' + NM.esc(member.id) + '.</p><div><button class="btn btn-ghost" id="reset">Reset demo membership</button></div></div>';
      document.getElementById('reset').onclick = function () { NM.write('nm_member', null); member = null; render(); };
      return;
    }
    root.innerHTML = planCard('trial') + planCard('monthly');
    root.querySelectorAll('form').forEach(function (form) {
      form.onsubmit = async function (e) {
        e.preventDefault();
        var kind = form.getAttribute('data-kind');
        await NMT.identify({ email: form.querySelector('input').value, country: m.country });
        if (kind === 'trial') {
          member = { kind: 'trial', id: NM.newId('trial_'), plan: 'club_trial_30d' };
          NMT.trialStarted(member.plan, member.id);
        } else {
          member = { kind: 'monthly', id: NM.newId('sub_'), plan: 'club_monthly' };
          NMT.subscriptionCreated(member.plan, monthly.price[m.currency], m.currency, member.id);
        }
        NM.write('nm_member', member);
        render();
      };
    });
  }
  render();
};
