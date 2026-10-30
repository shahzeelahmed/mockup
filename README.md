# Frappe design workspace

Vue mockups built with frappe-ui, plus a gallery to browse them.

## Run

```sh
bun install
bun dev.js <round>
```

- Gallery: http://127.0.0.1:4818/mockups/
- Live round: http://127.0.0.1:4818/

## Rounds

Each round is a folder in `mockups/` with a `Mockup.vue` and a `design.json`. Rounds are gitignored, only the gallery app is tracked.

| Command | Does |
| --- | --- |
| `bun manage.js index` | Refresh the gallery |
| `bun manage.js fork <round> <new-round>` | Start the next version |
| `bun manage.js status <round> <status>` | exploring, selected, superseded or implemented |
| `bun manage.js delete <round>` | Move it to `.trash` |
| `bun build.js <round>` | Export a static `mockup.html` |

## Inspos

Save a design reference to the gallery's Inspos tab:

```sh
bun manage.js inspo <slug> /path/to/inspo.json
```

```json
{
  "title": "Quiet navigation",
  "url": "https://example.com/design",
  "image": "/path/to/reference.png",
  "tags": ["navigation"],
  "notes": "Nice spacing and hover state."
}
```
