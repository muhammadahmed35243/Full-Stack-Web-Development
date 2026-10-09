// Shared UI helpers: escaping, avatars, relative time, toasts and the navbar.
(function () {
  const ui = {
    esc(value) {
      return String(value ?? '').replace(/[&<>"']/g, (c) => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
      ));
    },

    initials(name) {
      return name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
    },

    // Blocky 8x8 pixel-art faces in the style of Minecraft characters, generated as SVG
    // (no image files). Each member id maps to its own character so every face looks different.
    avatarSrc(user) {
      // S skin, H hair/accent, W eye white, E eye colour, N nose/shade, M mouth, D dark detail
      const DESIGNS = [
        { name: 'steve', bg: '#7fb3d5', noise: 1, pal: { S: '#c68c64', H: '#3b2314', W: '#ffffff', E: '#4a3fb0', N: '#a9714d', M: '#7a3b2e', D: '#3b2314' },
          rows: ['HHHHHHHH', 'HHHHHHHH', 'HSSSSSSH', 'SWESSEWS', 'SSSSSSSS', 'SSSNNSSS', 'SSMMMMSS', 'SSSSSSSS'] },
        { name: 'creeper', bg: '#a5d6a7', noise: 3, pal: { S: '#5dbb4a', H: '#4aa23a', W: '#5dbb4a', E: '#5dbb4a', N: '#4aa23a', M: '#1f3d1b', D: '#1f3d1b' },
          rows: ['SSSSSSSS', 'SSSSSSSS', 'SDDSSDDS', 'SDDSSDDS', 'SSSDDSSS', 'SSDDDDSS', 'SSDDDDSS', 'SSDSSDSS'] },
        { name: 'zombie', bg: '#80cbc4', noise: 2, pal: { S: '#6a9a55', H: '#2f4a3a', W: '#cfe0cf', E: '#2a2f7a', N: '#527a44', M: '#35502c', D: '#2f4a3a' },
          rows: ['HHHHHHHH', 'HHHHHHHH', 'HSSSSSSH', 'SWESSEWS', 'SSSSSSSS', 'SSSNNSSS', 'SSMMMMSS', 'SSNSSNSS'] },
        { name: 'alex', bg: '#ffcc80', noise: 1, pal: { S: '#e8b48f', H: '#d9792b', W: '#ffffff', E: '#2f7a3d', N: '#cf9873', M: '#b5594a', D: '#b5611f' },
          rows: ['HHHHHHHH', 'HHHHHHHH', 'HHSSSSHH', 'HWESSEWH', 'HSSSSSSH', 'HSSNNSSH', 'HSSMMSSH', 'HHSSSSHH'] },
        { name: 'skeleton', bg: '#b0bec5', noise: 2, pal: { S: '#d9d9d9', H: '#bdbdbd', W: '#d9d9d9', E: '#d9d9d9', N: '#bdbdbd', M: '#2b2b2b', D: '#2b2b2b' },
          rows: ['HHHHHHHH', 'SSSSSSSS', 'SDDSSDDS', 'SDDSSDDS', 'SSSNNSSS', 'SSSSSSSS', 'SDSDSDSD', 'SSSSSSSS'] },
        { name: 'enderman', bg: '#9575cd', noise: 1, pal: { S: '#1a1a1a', H: '#101010', W: '#1a1a1a', E: '#e879f9', N: '#262626', M: '#262626', D: '#262626' },
          rows: ['HHHHHHHH', 'HHHHHHHH', 'SSSSSSSS', 'SEESSEES', 'SSSSSSSS', 'SSSSSSSS', 'SMMMMMMS', 'SSSSSSSS'] },
        { name: 'pig', bg: '#f8bbd0', noise: 2, pal: { S: '#f0a7b4', H: '#e68a9b', W: '#ffffff', E: '#2a2a2a', N: '#d9788a', M: '#7a2f3d', D: '#7a2f3d' },
          rows: ['SSSSSSSS', 'SSSSSSSS', 'SESSSSES', 'SSSSSSSS', 'SSNNNNSS', 'SSNDNDSS', 'SSNNNNSS', 'SSSSSSSS'] },
        { name: 'villager', bg: '#c5e1a5', noise: 1, pal: { S: '#b98a6a', H: '#5a3d26', W: '#ffffff', E: '#2f7a3d', N: '#9c6f50', M: '#7a4a38', D: '#5a3d26' },
          rows: ['SSSSSSSS', 'SSSSSSSS', 'HHHHHHHH', 'SWESSEWS', 'SSSNNSSS', 'SSNNNNSS', 'SSSNNSSS', 'SSMMMMSS'] },
      ];
      const id = user.id;
      const d = DESIGNS[(id - 1 + DESIGNS.length * 10) % DESIGNS.length];

      let cells = '';
      d.rows.forEach((row, y) => {
        [...row].forEach((ch, x) => {
          cells += `<rect x='${x}' y='${y}' width='1.02' height='1.02' fill='${d.pal[ch]}'/>`;
          // deterministic texture noise so flat colours look like Minecraft textures
          const n = (id * 31 + x * 17 + y * 7 + x * y * 3) % 6;
          if (ch !== 'W' && ch !== 'E') {
            if (n < d.noise) cells += `<rect x='${x}' y='${y}' width='1' height='1' fill='rgba(0,0,0,.1)'/>`;
            else if (n === 5 && d.noise > 1) cells += `<rect x='${x}' y='${y}' width='1' height='1' fill='rgba(255,255,255,.08)'/>`;
          }
        });
      });
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='-1 -1 10 10' shape-rendering='crispEdges'>`
        + `<rect x='-1' y='-1' width='10' height='10' fill='${d.bg}'/>`
        + `<rect x='-0.25' y='-0.25' width='8.5' height='8.5' fill='rgba(0,0,0,.25)'/>${cells}</svg>`;
      return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    },

    avatar(user, size = 40) {
      return `<img class="avatar-img flex-shrink-0" src="${ui.avatarSrc(user)}" width="${size}" height="${size}" alt="${ui.esc(user.name)}">`;
    },

    timeAgo(iso) {
      const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
      if (mins < 1) return 'just now';
      if (mins < 60) return `${mins} min ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs} hr ago`;
      const days = Math.floor(hrs / 24);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    },

    toast(message, type = 'success') {
      let box = document.getElementById('toastBox');
      if (!box) {
        box = document.createElement('div');
        box.id = 'toastBox';
        box.className = 'toast-container position-fixed top-0 end-0 p-3';
        document.body.appendChild(box);
      }
      const el = document.createElement('div');
      el.className = `toast align-items-center text-bg-${type} border-0`;
      el.setAttribute('role', 'alert');
      el.innerHTML = `<div class="d-flex"><div class="toast-body">${ui.esc(message)}</div>`
        + `<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button></div>`;
      box.appendChild(el);
      el.addEventListener('hidden.bs.toast', () => el.remove());
      new bootstrap.Toast(el, { delay: 3500 }).show();
    },

    unreadCount(userId) {
      return CF.db.messages().filter((m) => m.to === userId && !m.read).length;
    },

    renderNavbar(active) {
      const host = document.getElementById('nav');
      const me = CF.auth.current();
      if (!host || !me) return;
      const unread = ui.unreadCount(me.id);
      const link = (key, href, icon, label, extra = '') =>
        `<li class="nav-item"><a class="nav-link ${active === key ? 'active fw-semibold' : ''}" href="${href}">`
        + `<i class="bi ${icon} me-1"></i>${label}${extra}</a></li>`;
      host.innerHTML = `
        <nav class="navbar navbar-expand-md navbar-dark bg-brand sticky-top shadow-sm">
          <div class="container">
            <a class="navbar-brand fw-bold" href="home.html"><i class="bi bi-link-45deg"></i> Connec<span class="text-warning">Friend</span></a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu" aria-label="Toggle navigation">
              <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navMenu">
              <ul class="navbar-nav me-auto">
                ${link('home', 'home.html', 'bi-house-door', 'Home')}
                ${link('profile', 'profile.html', 'bi-person-circle', 'My Profile')}
                ${link('messages', 'messages.html', 'bi-chat-dots', 'Messages',
                  unread ? ` <span class="badge rounded-pill text-bg-warning">${unread}</span>` : '')}
              </ul>
              <div class="d-flex align-items-center gap-2 text-white">
                ${ui.avatar(me, 32)}<span class="small">${ui.esc(me.name)}</span>
                <button id="logoutBtn" class="btn btn-sm btn-outline-light"><i class="bi bi-box-arrow-right"></i> Logout</button>
              </div>
            </div>
          </div>
        </nav>`;
      document.getElementById('logoutBtn').addEventListener('click', () => CF.auth.logout());
    },
  };

  CF.ui = ui;
})();
