// Private messaging. Any member can message any other member; messages are stored locally.
(function () {
  const me = CF.auth.require();
  if (!me) return;
  const db = CF.db;
  const { esc, avatar, timeAgo } = CF.ui;
  const $ = (id) => document.getElementById(id);

  const MAX_LENGTH = 500;

  let activeId = null;

  const involves = (m, other) => (m.from === me.id && m.to === other) || (m.from === other && m.to === me.id);

  // Partners ordered by their latest message; a freshly chosen member with no history is pinned on top.
  function partners() {
    const latest = new Map();
    db.messages().forEach((m) => {
      if (m.from !== me.id && m.to !== me.id) return;
      const other = m.from === me.id ? m.to : m.from;
      if (!latest.has(other) || new Date(m.time) > new Date(latest.get(other).time)) latest.set(other, m);
    });
    const list = [...latest.entries()].sort((a, b) => new Date(b[1].time) - new Date(a[1].time));
    if (activeId && !latest.has(activeId)) list.unshift([activeId, null]);
    return list;
  }

  function renderConversations() {
    const items = partners().map(([id, last]) => {
      const user = db.user(id);
      if (!user) return '';
      const unread = db.messages().filter((m) => m.from === id && m.to === me.id && !m.read).length;
      return `
        <button class="list-group-item list-group-item-action d-flex align-items-center gap-2 ${id === activeId ? 'active' : ''}" data-open="${id}">
          ${avatar(user, 40)}
          <div class="flex-grow-1 text-start overflow-hidden">
            <div class="fw-semibold text-truncate">${esc(user.name)}</div>
            <div class="small text-truncate ${id === activeId ? '' : 'text-muted'}">${last ? esc((last.from === me.id ? 'You: ' : '') + last.text) : 'New conversation'}</div>
          </div>
          ${unread ? `<span class="badge rounded-pill text-bg-warning">${unread}</span>` : ''}
        </button>`;
    }).join('');
    $('convList').innerHTML = items || '<div class="p-3 text-muted small">No conversations yet. Press New to start one.</div>';
  }

  function renderThread() {
    const other = activeId ? db.user(activeId) : null;
    const open = !!other;
    $('convPane').classList.toggle('d-none', open && window.matchMedia('(max-width: 767.98px)').matches);
    $('threadPane').classList.toggle('d-none', !open && window.matchMedia('(max-width: 767.98px)').matches);
    $('msgForm').classList.toggle('d-none', !open);

    if (!open) {
      $('threadHeader').innerHTML = '<span class="text-muted">Select a conversation or start a new one.</span>';
      $('threadBody').innerHTML = '<div class="h-100 d-flex flex-column align-items-center justify-content-center text-center gap-3"><i class="bi bi-chat-square-text-fill fs-1 text-brand"></i><span class="heading-font small">No chat open</span><span class="text-muted small">Pick a conversation or press New.</span></div>';
      return;
    }
    const isFriend = CF.friends.isFriend(me.id, other.id);
    $('threadHeader').innerHTML = `
      <button class="btn btn-sm btn-outline-secondary d-md-none" id="backBtn" aria-label="Back"><i class="bi bi-arrow-left"></i></button>
      ${avatar(other, 40)}
      <div class="lh-sm flex-grow-1">
        <a class="fw-semibold text-decoration-none text-dark" href="profile.html?id=${other.id}">${esc(other.name)}</a>
        <div class="small text-muted">${isFriend ? 'Friend' : 'Not a friend yet'} &middot; last login ${timeAgo(other.lastLogin)}</div>
      </div>`;

    const msgs = db.messages().filter((m) => involves(m, other.id)).sort((a, b) => new Date(a.time) - new Date(b.time));
    $('threadBody').innerHTML = msgs.length
      ? msgs.map((m) => {
          const mine = m.from === me.id;
          return `<div class="d-flex mb-2 ${mine ? 'justify-content-end' : ''}">`
            + `<div class="bubble rounded-3 px-3 py-2 ${mine ? 'bg-brand text-white' : 'bg-white border'}">`
            + `<span class="bubble-text">${esc(m.text)}</span>`
            + `<div class="small ${mine ? 'text-white-50' : 'text-muted'} text-end">${timeAgo(m.time)}${mine ? ' <i class="bi bi-check2"></i>' : ''}</div>`
            + '</div></div>';
        }).join('')
      : '<div class="text-center mt-5"><i class="bi bi-hand-wave fs-2 text-brand"></i><div class="heading-font small mt-3">Say hello!</div><div class="text-muted small mt-2">No messages yet.</div></div>';
    $('threadBody').scrollTop = $('threadBody').scrollHeight;
  }

  function markRead() {
    if (!activeId) return;
    const all = db.messages();
    let changed = false;
    all.forEach((m) => { if (m.from === activeId && m.to === me.id && !m.read) { m.read = true; changed = true; } });
    if (changed) db.saveMessages(all);
  }

  function renderAll() {
    markRead();
    renderConversations();
    renderThread();
    CF.ui.renderNavbar('messages');
  }

  function open(id) {
    if (!db.user(id) || id === me.id) return;
    activeId = id;
    history.replaceState(null, '', `messages.html?to=${id}`);
    renderAll();
  }

  function send(text) {
    text = text.trim();
    if (!text) return { ok: false, message: 'Type a message first.' };
    if (text.length > MAX_LENGTH) return { ok: false, message: `Messages are limited to ${MAX_LENGTH} characters.` };
    const all = db.messages();
    all.push({ id: db.nextId(all), from: me.id, to: activeId, text, time: new Date().toISOString(), read: false });
    db.saveMessages(all);
    return { ok: true };
  }

  // --- events ---
  $('convList').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-open]');
    if (btn) open(Number(btn.dataset.open));
  });

  $('threadHeader').addEventListener('click', (e) => {
    if (e.target.closest('#backBtn')) { activeId = null; history.replaceState(null, '', 'messages.html'); renderAll(); }
  });

  $('msgForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('msgInput');
    const result = send(input.value);
    if (!result.ok) { CF.ui.toast(result.message, 'danger'); return; }
    input.value = '';
    renderAll();
  });

  // Enter sends, Shift+Enter inserts a newline.
  $('msgInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('msgForm').requestSubmit(); }
  });

  // New-message modal lists every member, friends first.
  function renderMembers(query = '') {
    const q = query.trim().toLowerCase();
    const members = db.users().filter((u) => u.id !== me.id && u.name.toLowerCase().includes(q))
      .sort((a, b) => Number(CF.friends.isFriend(me.id, b.id)) - Number(CF.friends.isFriend(me.id, a.id)) || a.name.localeCompare(b.name));
    $('memberList').innerHTML = members.length
      ? members.map((u) => `
          <button class="list-group-item list-group-item-action d-flex align-items-center gap-2" data-member="${u.id}" data-bs-dismiss="modal">
            ${avatar(u, 36)}<span class="flex-grow-1 text-start">${esc(u.name)}</span>
            ${CF.friends.isFriend(me.id, u.id) ? '<span class="badge text-bg-success">Friend</span>' : ''}
          </button>`).join('')
      : '<div class="text-muted small">No members found.</div>';
  }
  $('newModal').addEventListener('show.bs.modal', () => { $('memberSearch').value = ''; renderMembers(); });
  $('memberSearch').addEventListener('input', (e) => renderMembers(e.target.value));
  $('memberList').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-member]');
    if (btn) open(Number(btn.dataset.member));
  });

  // Stay in sync with other tabs and with viewport changes.
  window.addEventListener('storage', renderAll);
  window.addEventListener('resize', renderThread);

  const to = Number(new URLSearchParams(window.location.search).get('to'));
  if (to) activeId = db.user(to) && to !== me.id ? to : null;
  renderAll();
})();
