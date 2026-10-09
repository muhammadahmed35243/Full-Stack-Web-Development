// Data layer: seeds demo data on first run and exposes typed accessors over localStorage.
(function () {
  const S = CF.storage;
  const KEYS = {
    users: 'cf_users',
    posts: 'cf_posts',
    messages: 'cf_messages',
    requests: 'cf_requests',
    ratings: 'cf_ratings',
    session: 'cf_session',
  };

  const ago = (minutes) => new Date(Date.now() - minutes * 60000).toISOString();

  function seedUsers() {
    const base = (id, username, name, color, city, email, age, bio, lastLoginMin, friends, ignoreList) => ({
      id, username, password: 'pass123', name, color, city, email, age, bio,
      joined: '2024-0' + ((id % 9) + 1) + '-15',
      lastLogin: ago(lastLoginMin), friends, ignoreList,
    });
    return [
      base(1, 'ali', 'Ali Raza', '#0f766e', 'Islamabad', 'ali@connecfriend.test', 21, 'CS student. Coffee, code and cricket.', 5, [2, 3, 4, 5], [8]),
      base(2, 'sara', 'Sara Khan', '#c2410c', 'Lahore', 'sara@connecfriend.test', 22, 'Photographer and part-time baker.', 12, [1, 3], []),
      base(3, 'hamza', 'Hamza Malik', '#4338ca', 'Karachi', 'hamza@connecfriend.test', 23, 'Gamer, gym rat, aspiring founder.', 180, [1, 2, 5], []),
      base(4, 'ayesha', 'Ayesha Noor', '#be185d', 'Islamabad', 'ayesha@connecfriend.test', 21, 'Loves hiking the Margalla trails.', 45, [1], []),
      base(5, 'bilal', 'Bilal Ahmed', '#4d7c0f', 'Peshawar', 'bilal@connecfriend.test', 24, 'Backend dev. Tea over coffee.', 1500, [1, 3], []),
      base(6, 'zara', 'Zara Iqbal', '#a16207', 'Multan', 'zara@connecfriend.test', 20, 'Digital artist.', 90, [], [1]),
      base(7, 'omar', 'Omar Farooq', '#0369a1', 'Rawalpindi', 'omar@connecfriend.test', 25, 'Travel blogger.', 300, [], []),
      base(8, 'hira', 'Hira Tariq', '#7e22ce', 'Quetta', 'hira@connecfriend.test', 22, 'Book club organiser.', 600, [], []),
    ];
  }

  function seedPosts() {
    const post = (id, author, text, minutes, audience, likes, dislikes) =>
      ({ id, author, text, time: ago(minutes), audience, likes, dislikes });
    return [
      post(1, 2, 'Just finished a sunrise shoot at Lake View Park. Worth waking up at 5am!', 25, 'all', [1, 3, 4], []),
      post(2, 3, 'Hey Ali, are we still on for the project meeting tomorrow?', 70, [1], [], []),
      post(3, 3, 'Surprise party for Bilal on Friday. Keep it quiet!', 95, [2], [2], []),
      post(4, 4, 'Margalla Trail 3 was packed today but the view was incredible.', 200, 'all', [1, 2], [5]),
      post(5, 5, 'Hot take: tabs are better than spaces.', 1400, 'all', [3], [1, 2, 4]),
      post(6, 2, 'New banana bread recipe is a hit. DM me for the recipe.', 2000, 'all', [4], []),
      post(7, 1, 'Starting my Full Stack Web Development assignment today.', 3000, 'all', [2], []),
    ];
  }

  function seedMessages() {
    const msg = (id, from, to, text, minutes, read) => ({ id, from, to, text, time: ago(minutes), read });
    return [
      msg(1, 2, 1, 'Hey Ali! Did you see the new photos I posted?', 20, false),
      msg(2, 1, 4, 'Are you joining the hike on Sunday?', 300, true),
      msg(3, 4, 1, 'Yes, count me in!', 290, true),
      msg(4, 6, 1, 'Hi! I saw your profile and loved your bio. Can we chat?', 60, false),
    ];
  }

  const db = {
    KEYS,

    init() {
      if (!S.get(KEYS.users)) S.set(KEYS.users, seedUsers());
      if (!S.get(KEYS.posts)) S.set(KEYS.posts, seedPosts());
      if (!S.get(KEYS.messages)) S.set(KEYS.messages, seedMessages());
      if (!S.get(KEYS.requests)) S.set(KEYS.requests, [{ id: 1, from: 7, to: 1, status: 'pending', time: ago(120) }]);
      if (!S.get(KEYS.ratings)) S.set(KEYS.ratings, {});
    },

    reset() {
      Object.values(KEYS).forEach((k) => S.remove(k));
      db.init();
    },

    users: () => S.get(KEYS.users, []),
    saveUsers: (v) => S.set(KEYS.users, v),
    user: (id) => db.users().find((u) => u.id === Number(id)) || null,
    updateUser(id, patch) {
      const users = db.users();
      const u = users.find((x) => x.id === Number(id));
      if (!u) return null;
      Object.assign(u, patch);
      db.saveUsers(users);
      return u;
    },

    posts: () => S.get(KEYS.posts, []),
    savePosts: (v) => S.set(KEYS.posts, v),
    messages: () => S.get(KEYS.messages, []),
    saveMessages: (v) => S.set(KEYS.messages, v),
    requests: () => S.get(KEYS.requests, []),
    saveRequests: (v) => S.set(KEYS.requests, v),
    ratings: () => S.get(KEYS.ratings, {}),
    saveRatings: (v) => S.set(KEYS.ratings, v),

    nextId: (list) => list.reduce((max, x) => Math.max(max, x.id), 0) + 1,
  };

  CF.db = db;
  db.init();
})();
