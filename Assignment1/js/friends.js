// Friends: ordering by login, invitations (with ignore-list check), ratings and ignore management.
(function () {
  const db = CF.db;
  const ui = CF.ui;

  const RATINGS = [
    { value: 1, label: 'Stupid', icon: 'bi-emoji-dizzy' },
    { value: 2, label: 'Cool', icon: 'bi-emoji-sunglasses' },
    { value: 3, label: 'Trustworthy', icon: 'bi-shield-check' },
  ];

  const ratingKey = (rater, target) => `${rater}:${target}`;

  const friends = {
    RATINGS,

    // Friends ordered by most recent login first.
    list(userId) {
      const user = db.user(userId);
      if (!user) return [];
      return user.friends.map((id) => db.user(id)).filter(Boolean)
        .sort((a, b) => new Date(b.lastLogin) - new Date(a.lastLogin));
    },

    isFriend: (a, b) => !!db.user(a)?.friends.includes(Number(b)),

    pendingBetween: (from, to) =>
      db.requests().find((r) => r.from === from && r.to === to && r.status === 'pending'),

    status(me, other) {
      if (me === other) return 'self';
      if (friends.isFriend(me, other)) return 'friend';
      if (friends.pendingBetween(me, other)) return 'sent';
      if (friends.pendingBetween(other, me)) return 'incoming';
      return 'none';
    },

    // Everyone who is not yet connected and not on my ignore list.
    suggestions(me) {
      const mine = db.user(me);
      return db.users().filter((u) =>
        u.id !== me && !mine.friends.includes(u.id) && !mine.ignoreList.includes(u.id)
        && !friends.pendingBetween(u.id, me));
    },

    invite(from, to) {
      const target = db.user(to);
      if (!target) return { ok: false, message: 'That member does not exist.' };
      if (from === to) return { ok: false, message: 'You cannot add yourself.' };
      if (friends.isFriend(from, to)) return { ok: false, message: `You are already friends with ${target.name}.` };
      if (target.ignoreList.includes(from)) return { ok: false, message: `Your request to ${target.name} cannot be sent.` };
      if (db.user(from).ignoreList.includes(to)) return { ok: false, message: `${target.name} is on your ignore list. Remove them first.` };
      if (friends.pendingBetween(to, from)) return { ok: false, message: `${target.name} already sent you a request. Accept it instead.` };
      if (friends.pendingBetween(from, to)) return { ok: false, message: 'You already sent a request to this member.' };
      const requests = db.requests();
      requests.push({ id: db.nextId(requests), from, to, status: 'pending', time: new Date().toISOString() });
      db.saveRequests(requests);
      return { ok: true, message: `Friend request sent to ${target.name}.` };
    },

    incoming: (me) => db.requests().filter((r) => r.to === me && r.status === 'pending'),

    respond(requestId, accept) {
      const requests = db.requests();
      const req = requests.find((r) => r.id === requestId);
      if (!req) return { ok: false, message: 'Request not found.' };
      req.status = accept ? 'accepted' : 'declined';
      db.saveRequests(requests);
      if (accept) {
        [[req.from, req.to], [req.to, req.from]].forEach(([a, b]) => {
          const u = db.user(a);
          if (!u.friends.includes(b)) db.updateUser(a, { friends: [...u.friends, b] });
        });
      }
      return { ok: true, message: accept ? 'Friend request accepted.' : 'Friend request declined.' };
    },

    getRating: (rater, target) => db.ratings()[ratingKey(rater, target)] || 0,

    // Clicking the active rating clears it.
    rate(rater, target, value) {
      if (!friends.isFriend(rater, target)) return { ok: false, message: 'You can only rate friends.' };
      if (![1, 2, 3].includes(value)) return { ok: false, message: 'Rating must be between 1 and 3.' };
      const ratings = db.ratings();
      const key = ratingKey(rater, target);
      if (ratings[key] === value) delete ratings[key]; else ratings[key] = value;
      db.saveRatings(ratings);
      return { ok: true, message: ratings[key] ? `Rated ${db.user(target).name} as ${RATINGS[value - 1].label}.` : 'Rating removed.' };
    },

    // Ignoring someone also removes any friendship and pending requests between you.
    ignore(me, target) {
      const mine = db.user(me);
      if (!db.user(target) || me === target) return { ok: false, message: 'Invalid member.' };
      if (mine.ignoreList.includes(target)) return { ok: false, message: 'Already on your ignore list.' };
      db.updateUser(me, { ignoreList: [...mine.ignoreList, target], friends: mine.friends.filter((f) => f !== target) });
      const other = db.user(target);
      db.updateUser(target, { friends: other.friends.filter((f) => f !== me) });
      db.saveRequests(db.requests().filter((r) => !((r.from === me && r.to === target) || (r.from === target && r.to === me))));
      return { ok: true, message: `${other.name} added to your ignore list.` };
    },

    unignore(me, target) {
      const mine = db.user(me);
      db.updateUser(me, { ignoreList: mine.ignoreList.filter((id) => id !== target) });
      return { ok: true, message: 'Removed from your ignore list.' };
    },

    ratingHtml(me, targetId) {
      const current = friends.getRating(me, targetId);
      const buttons = RATINGS.map((r) =>
        `<button type="button" class="btn btn-outline-secondary ${current === r.value ? 'active' : ''}" `
        + `data-action="rate" data-id="${targetId}" data-value="${r.value}" title="${r.label}" aria-label="${r.label}">`
        + `<i class="bi ${r.icon}"></i></button>`).join('');
      const label = current ? `<span class="small text-muted ms-2">${RATINGS[current - 1].label}</span>` : '';
      return `<div class="d-flex align-items-center"><div class="btn-group btn-group-sm" role="group" aria-label="Rate friend">${buttons}</div>${label}</div>`;
    },

    // Button/label for the invite state of another member.
    inviteHtml(me, otherId) {
      switch (friends.status(me, otherId)) {
        case 'friend': return '<span class="badge text-bg-success"><i class="bi bi-check2"></i> Friends</span>';
        case 'sent': return '<span class="badge text-bg-secondary">Request pending</span>';
        case 'incoming': return '<span class="badge text-bg-info">Wants to connect</span>';
        case 'none': return `<button class="btn btn-sm btn-primary" data-action="invite" data-id="${otherId}"><i class="bi bi-person-plus"></i> Add</button>`;
        default: return '';
      }
    },

    // One delegated click handler for every friend-related button on a page.
    bindActions(afterChange) {
      document.addEventListener('click', (event) => {
        const btn = event.target.closest('[data-action]');
        const me = CF.auth.current();
        if (!btn || !me) return;
        const id = Number(btn.dataset.id);
        let result = null;
        switch (btn.dataset.action) {
          case 'invite': result = friends.invite(me.id, id); break;
          case 'rate': result = friends.rate(me.id, id, Number(btn.dataset.value)); break;
          case 'accept': result = friends.respond(id, true); break;
          case 'decline': result = friends.respond(id, false); break;
          case 'ignore': result = friends.ignore(me.id, id); break;
          case 'unignore': result = friends.unignore(me.id, id); break;
          default: return;
        }
        ui.toast(result.message, result.ok ? 'success' : 'danger');
        if (result.ok) afterChange();
      });
    },
  };

  CF.friends = friends;
})();
