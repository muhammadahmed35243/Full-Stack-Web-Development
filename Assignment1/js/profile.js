// Profile page controller. Shows your own profile by default, or another member via ?id=.
(function () {
  const me = CF.auth.require();
  if (!me) return;
  const { esc, avatar, timeAgo } = CF.ui;
  const $ = (id) => document.getElementById(id);

  const param = new URLSearchParams(window.location.search).get('id');
  const targetId = param === null ? me.id : Number(param);
  const target = Number.isInteger(targetId) ? CF.db.user(targetId) : null;

  if (!target) {
    $('profileBody').classList.add('d-none');
    $('profileError').textContent = 'That profile does not exist.';
    $('profileError').classList.remove('d-none');
    CF.ui.renderNavbar('profile');
    return;
  }
  const isSelf = target.id === me.id;

  function renderCard() {
    const status = CF.friends.status(me.id, target.id);
    const canSeeEmail = isSelf || status === 'friend';
    const actions = isSelf ? '' : `
      <div class="d-flex justify-content-center gap-2 mt-3">
        ${CF.friends.inviteHtml(me.id, target.id)}
        <a class="btn btn-sm btn-outline-primary" href="messages.html?to=${target.id}"><i class="bi bi-chat-dots"></i> Message</a>
      </div>
      ${status === 'friend' ? `<div class="mt-3"><div class="small text-muted mb-1">Your rating</div>${CF.friends.ratingHtml(me.id, target.id)}</div>` : ''}`;
    $('profileCard').innerHTML = `
      ${avatar(target, 120)}
      <h1 class="h4 mt-3 mb-0">${esc(target.name)}</h1>
      <div class="text-muted">@${esc(target.username)}</div>
      <p class="mt-3">${esc(target.bio)}</p>
      <ul class="list-unstyled text-start small mb-0">
        <li class="mb-1"><i class="bi bi-geo-alt text-brand"></i> ${esc(target.city)}</li>
        <li class="mb-1"><i class="bi bi-cake2 text-brand"></i> ${target.age} years old</li>
        <li class="mb-1"><i class="bi bi-envelope text-brand"></i> ${canSeeEmail ? esc(target.email) : '<span class="text-muted">Visible to friends only</span>'}</li>
        <li class="mb-1"><i class="bi bi-calendar-check text-brand"></i> Joined ${esc(target.joined)}</li>
        <li><i class="bi bi-clock-history text-brand"></i> Last login ${timeAgo(target.lastLogin)}</li>
      </ul>
      ${actions}`;
  }

  function renderFriends() {
    const list = CF.friends.list(target.id);
    $('friendCount').textContent = list.length;
    $('friendList').innerHTML = list.length
      ? list.map((f) => `
          <li class="list-group-item d-flex flex-wrap align-items-center gap-3">
            ${avatar(f, 44)}
            <div class="flex-grow-1 lh-sm">
              <a class="fw-semibold text-decoration-none text-dark" href="profile.html?id=${f.id}">${esc(f.name)}</a>
              <div class="small text-muted">${esc(f.city)} &middot; last login ${timeAgo(f.lastLogin)}</div>
            </div>
            ${isSelf ? CF.friends.ratingHtml(me.id, f.id) : (f.id === me.id ? '<span class="badge text-bg-success">You</span>' : CF.friends.inviteHtml(me.id, f.id))}
            ${isSelf ? `<a class="btn btn-sm btn-outline-primary" href="messages.html?to=${f.id}" title="Message"><i class="bi bi-chat-dots"></i></a>` : ''}
          </li>`).join('')
      : '<li class="list-group-item text-muted">No friends to show.</li>';
  }

  function renderOwnerPanels() {
    if (!isSelf) return;
    const reqs = CF.friends.incoming(me.id);
    $('requestsCard').classList.toggle('d-none', !reqs.length);
    $('requestList').innerHTML = reqs.map((r) => {
      const from = CF.db.user(r.from);
      return `
        <li class="list-group-item d-flex align-items-center gap-3">
          ${avatar(from, 36)}<span class="flex-grow-1 fw-semibold">${esc(from.name)}</span>
          <button class="btn btn-sm btn-primary" data-action="accept" data-id="${r.id}">Accept</button>
          <button class="btn btn-sm btn-outline-secondary" data-action="decline" data-id="${r.id}">Decline</button>
        </li>`;
    }).join('');

    const mine = CF.db.user(me.id);
    $('ignoreCard').classList.remove('d-none');
    const candidates = CF.db.users().filter((u) => u.id !== me.id && !mine.ignoreList.includes(u.id));
    $('ignoreSelect').innerHTML = candidates.map((u) => `<option value="${u.id}">${esc(u.name)}</option>`).join('');
    $('ignoreBtn').disabled = !candidates.length;
    $('ignoreList').innerHTML = mine.ignoreList.length
      ? mine.ignoreList.map((id) => CF.db.user(id)).filter(Boolean).map((u) => `
          <li class="list-group-item d-flex align-items-center gap-2">
            ${avatar(u, 32)}<span class="flex-grow-1">${esc(u.name)}</span>
            <button class="btn btn-sm btn-outline-secondary" data-action="unignore" data-id="${u.id}">Remove</button>
          </li>`).join('')
      : '<li class="list-group-item text-muted small">Nobody is ignored.</li>';
  }

  function renderAll() {
    renderCard();
    renderFriends();
    renderOwnerPanels();
    CF.ui.renderNavbar(isSelf ? 'profile' : '');
  }

  $('ignoreBtn').addEventListener('click', () => {
    const id = Number($('ignoreSelect').value);
    const result = CF.friends.ignore(me.id, id);
    CF.ui.toast(result.message, result.ok ? 'success' : 'danger');
    if (result.ok) renderAll();
  });

  CF.friends.bindActions(renderAll);
  renderAll();
})();
