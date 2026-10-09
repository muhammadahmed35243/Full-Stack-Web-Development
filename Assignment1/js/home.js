// Home page controller: friends (by last login), news feed, composer, requests and suggestions.
(function () {
  const me = CF.auth.require();
  if (!me) return;
  const { esc, avatar, timeAgo } = CF.ui;

  const $ = (id) => document.getElementById(id);
  const form = $('postForm');

  function renderFriends() {
    const list = CF.friends.list(me.id);
    $('friendList').innerHTML = list.length
      ? list.map((f) => `
          <li class="list-group-item">
            <div class="d-flex align-items-center gap-2 mb-1">
              ${avatar(f, 36)}
              <div class="lh-sm">
                <a class="fw-semibold text-decoration-none text-dark" href="profile.html?id=${f.id}">${esc(f.name)}</a>
                <div class="small text-muted">Last login ${timeAgo(f.lastLogin)}</div>
              </div>
            </div>
            ${CF.friends.ratingHtml(me.id, f.id)}
          </li>`).join('')
      : '<li class="list-group-item text-muted">No friends yet. Add someone from the right!</li>';
  }

  function renderPicker() {
    const list = CF.friends.list(me.id);
    const checked = new Set([...document.querySelectorAll('#friendPicker input:checked')].map((i) => i.value));
    $('friendPicker').innerHTML = list.length
      ? list.map((f) => `
          <div class="form-check">
            <input class="form-check-input" type="checkbox" value="${f.id}" id="pick${f.id}" ${checked.has(String(f.id)) ? 'checked' : ''}>
            <label class="form-check-label" for="pick${f.id}">${esc(f.name)}</label>
          </div>`).join('')
      : '<span class="text-muted small">You have no friends to choose from.</span>';
  }

  function renderFeed() {
    const posts = CF.feed.visibleTo(me.id);
    $('feedList').innerHTML = posts.length
      ? posts.map((p) => CF.feed.cardHtml(p, me.id)).join('')
      : '<div class="alert alert-light border">No news yet. Share something or add more friends.</div>';
  }

  function renderRequests() {
    const reqs = CF.friends.incoming(me.id);
    $('requestsCard').classList.toggle('d-none', !reqs.length);
    $('requestList').innerHTML = reqs.map((r) => {
      const from = CF.db.user(r.from);
      return `
        <li class="list-group-item">
          <div class="d-flex align-items-center gap-2 mb-2">${avatar(from, 32)}<a class="fw-semibold text-decoration-none text-dark" href="profile.html?id=${from.id}">${esc(from.name)}</a></div>
          <button class="btn btn-sm btn-primary" data-action="accept" data-id="${r.id}">Accept</button>
          <button class="btn btn-sm btn-outline-secondary" data-action="decline" data-id="${r.id}">Decline</button>
        </li>`;
    }).join('');
  }

  function renderSuggestions() {
    const list = CF.friends.suggestions(me.id);
    $('suggestList').innerHTML = list.length
      ? list.map((u) => `
          <li class="list-group-item d-flex align-items-center gap-2">
            ${avatar(u, 32)}
            <a class="flex-grow-1 text-decoration-none text-dark small fw-semibold" href="profile.html?id=${u.id}">${esc(u.name)}</a>
            ${CF.friends.inviteHtml(me.id, u.id)}
          </li>`).join('')
      : '<li class="list-group-item text-muted small">No more suggestions.</li>';
  }

  function renderWelcome() {
    const posts = CF.db.posts().filter((p) => p.author === me.id);
    const likes = posts.reduce((sum, p) => sum + p.likes.length, 0);
    const slot = (icon, num, label) =>
      `<div class="stat-slot"><i class="bi ${icon}"></i><span class="stat-num">${num}</span><small>${label}</small></div>`;
    $('welcome').innerHTML = `
      ${avatar(me, 84)}
      <div class="flex-grow-1 pb-2">
        <div class="heading-font">Welcome back, ${esc(me.name.split(' ')[0])}!</div>
        <div class="small mt-2 text-white-50">Last login ${timeAgo(me.lastLogin)} &middot; ${esc(me.city)}</div>
      </div>
      <div class="d-flex flex-wrap gap-2 pb-2">
        ${slot('bi-people-fill', CF.friends.list(me.id).length, 'Friends')}
        ${slot('bi-newspaper', posts.length, 'Posts')}
        ${slot('bi-hand-thumbs-up-fill', likes, 'Likes')}
        ${slot('bi-chat-dots-fill', CF.ui.unreadCount(me.id), 'Unread')}
        ${slot('bi-envelope-heart-fill', CF.friends.incoming(me.id).length, 'Requests')}
      </div>`;
  }

  function renderAll() {
    renderWelcome();
    renderFriends();
    renderPicker();
    renderFeed();
    renderRequests();
    renderSuggestions();
    CF.ui.renderNavbar('home');
  }

  // Composer
  const audienceMode = () => form.audience.value;
  form.addEventListener('change', (e) => {
    if (e.target.name === 'audience') $('friendPicker').classList.toggle('d-none', audienceMode() !== 'some');
  });
  $('postText').addEventListener('input', (e) => { $('charCount').textContent = e.target.value.length; });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const audience = audienceMode() === 'all'
      ? 'all'
      : [...document.querySelectorAll('#friendPicker input:checked')].map((i) => Number(i.value));
    const result = CF.feed.create(me.id, $('postText').value, audience);
    $('postError').textContent = result.ok ? '' : result.message;
    if (!result.ok) return;
    CF.ui.toast(result.message);
    form.reset();
    $('charCount').textContent = '0';
    $('friendPicker').classList.add('d-none');
    renderAll();
  });

  CF.feed.bindReactions($('feedList'), renderAll);
  CF.friends.bindActions(renderAll);
  renderAll();
})();
