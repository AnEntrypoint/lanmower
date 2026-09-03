# lanmower

Portfolio site for [@lanmower](https://github.com/lanmower). Distributed
systems, P2P, Hyperswarm, some blockchain.

**Live:** https://anentrypoint.github.io/lanmower/

## Build

There is no build. Three files and some CSS. Open `index.html` directly,
or serve it locally if your browser blocks `file://` fetches:

```bash
python -m http.server 8000
```

## Data

`data.js` is a snapshot. Regenerate it from the GitHub API whenever the repo
list drifts:

```bash
gh api users/lanmower > data-user.json
gh api "users/lanmower/repos?per_page=100&sort=updated&type=owner&page=1" > p1.json
gh api "users/lanmower/repos?per_page=100&sort=updated&type=owner&page=2" > p2.json
# then merge, filter out archived/forks, emit window.LANMOWER_* into data.js
```

There is a `node -e` one-liner that does the merge. See prior commits for
the exact shape.

## Deploy

GitHub Pages, `main` branch root. `.nojekyll` is in place so anything starting
with an underscore won't get eaten by the Jekyll pipeline (nothing here does,
but better to be explicit than to debug it at 2am).
