# ConnecFriend – Assignment 1 (CS 301)

Front-end only social network UI built with HTML, JavaScript and Bootstrap 5 (CDN). No server calls: all data is seeded into and persisted in `localStorage`.

## Run
Open `index.html` in a browser (internet needed once for the Bootstrap CDN).

## Demo accounts
Password for all: `pass123` — `ali`, `sara`, `hamza`, `ayesha`, `bilal`, `zara`, `omar`, `hira`.

Try as `ali`:
- `zara` has ali on her ignore list → inviting her fails.
- `hira` is on ali's ignore list; `omar` has a pending request to ali.
- Hamza's post shared "only with Sara" is hidden from ali.

"Reset demo data" on the login page restores the seed data.

## Structure
- `index.html` login · `home.html` feed · `profile.html` profile · `messages.html` chat
- `js/storage.js` localStorage wrapper · `js/data.js` seed + accessors · `js/auth.js` login/session
- `js/friends.js` invites, ratings, ignore list · `js/feed.js` posts, sharing, like/dislike
- `js/ui.js` navbar/toasts/helpers · `js/home.js`, `profile.js`, `messages.js` page controllers
