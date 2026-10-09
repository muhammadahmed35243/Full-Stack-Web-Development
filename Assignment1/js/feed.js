// News feed: visibility rules, posting/sharing, reactions and rendering.
(function () {
  const db = CF.db;
  const ui = CF.ui;
  const MAX_POST_LENGTH = 500;

  const feed = {
    MAX_POST_LENGTH,

    // Own posts + friends' posts shared with everyone or specifically with me, newest first.
    visibleTo(me) {
      const mine = db.user(me);
      return db.posts()
        .filter((p) => p.author === me
          || (mine.friends.includes(p.author) && (p.audience === 'all' || p.audience.includes(me))))
        .sort((a, b) => new Date(b.time) - new Date(a.time));
    },

    // audience: 'all' or an array of friend ids.
    create(me, text, audience) {
      text = (text || '').trim();
      if (!text) return { ok: false, message: 'Write something before sharing.' };
      if (text.length > MAX_POST_LENGTH) return { ok: false, message: `Posts are limited to ${MAX_POST_LENGTH} characters.` };
      if (audience !== 'all' && (!Array.isArray(audience) || !audience.length)) {
        return { ok: false, message: 'Pick at least one friend to share with.' };
      }
      const posts = db.posts();
      posts.push({ id: db.nextId(posts), author: me, text, time: new Date().toISOString(), audience, likes: [], dislikes: [] });
      db.savePosts(posts);
      return { ok: true, message: 'Your news has been shared.' };
    },

    // type: 'like' | 'dislike'. Each member has at most one reaction; clicking again removes it.
    react(me, postId, type) {
      const posts = db.posts();
      const post = posts.find((p) => p.id === postId);
      if (!post || !['like', 'dislike'].includes(type)) return false;
      const mine = type === 'like' ? 'likes' : 'dislikes';
      const other = type === 'like' ? 'dislikes' : 'likes';
      post[other] = post[other].filter((id) => id !== me);
      post[mine] = post[mine].includes(me) ? post[mine].filter((id) => id !== me) : [...post[mine], me];
      db.savePosts(posts);
      return true;
    },

    audienceLabel(post) {
      if (post.audience === 'all') return 'All friends';
      return `${post.audience.length} selected friend${post.audience.length > 1 ? 's' : ''}`;
    },

    cardHtml(post, me) {
      const author = db.user(post.author);
      if (!author) return '';
      const liked = post.likes.includes(me);
      const disliked = post.dislikes.includes(me);
      const isMe = author.id === me;
      return `
        <article class="card post-card mb-3 shadow-sm">
          <div class="card-body">
            <div class="d-flex align-items-center gap-3">
              ${ui.avatar(author, 48)}
              <div class="flex-grow-1">
                <a class="fw-semibold text-decoration-none text-dark" href="profile.html?id=${author.id}">${isMe ? 'You' : ui.esc(author.name)}</a>
                <span class="badge text-bg-light border ms-1"><i class="bi bi-eye"></i> ${feed.audienceLabel(post)}</span>
                <div class="small text-muted">
                  <i class="bi bi-clock-history"></i> Last login ${ui.timeAgo(author.lastLogin)}
                  &middot; posted ${ui.timeAgo(post.time)}
                </div>
              </div>
            </div>
            <p class="mt-3 mb-3 post-text">${ui.esc(post.text)}</p>
            <div class="d-flex gap-2">
              <button class="btn btn-sm ${liked ? 'btn-success' : 'btn-outline-success'}" data-react="like" data-id="${post.id}">
                <i class="bi bi-hand-thumbs-up${liked ? '-fill' : ''}"></i> Like <span class="badge text-bg-light">${post.likes.length}</span>
              </button>
              <button class="btn btn-sm ${disliked ? 'btn-danger' : 'btn-outline-danger'}" data-react="dislike" data-id="${post.id}">
                <i class="bi bi-hand-thumbs-down${disliked ? '-fill' : ''}"></i> Dislike <span class="badge text-bg-light">${post.dislikes.length}</span>
              </button>
            </div>
          </div>
        </article>`;
    },

    // Delegated like/dislike handler for any container.
    bindReactions(container, afterChange) {
      container.addEventListener('click', (event) => {
        const btn = event.target.closest('[data-react]');
        const me = CF.auth.current();
        if (!btn || !me) return;
        if (feed.react(me.id, Number(btn.dataset.id), btn.dataset.react)) afterChange();
      });
    },
  };

  CF.feed = feed;
})();
