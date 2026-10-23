---
name: maintain-site
description: >-
  Use this skill when updating the Gurķis LV website layout, homepage catalog,
  client-side search, styling, or Jekyll configuration (_config.yml, _layouts/, assets/, search.json).
---

# Maintain Gurķis LV Jekyll Site (`maintain-site`)

Use this guide when modifying the site structure, search functionality, or visual design of the Gurķis LV recipe catalog.

## 1. GitHub Pages Compatibility Constraints

The repository is built natively by GitHub Pages using Jekyll:
- **Do NOT add custom Ruby plugins** in `_plugins/` or unapproved gems in `Gemfile`, as GitHub Pages runs Jekyll in `--safe` mode.
- Rely exclusively on standard **Liquid templates** (`{{ ... }}`, `{% for ... %}`), **Jekyll Collections** (`site.recipes`), and **vanilla client-side JavaScript** (`assets/js/search.js`).
- Always use `{{ '...path...' | relative_url }}` for internal links, CSS, JS, and `search.json` fetches so the site works seamlessly whether hosted at a custom domain (`gurkis.lv`) or a project subpath (`username.github.io/gurkis-lv/`).

## 2. How the Catalog & Search Index Work

1. **Collection (`_recipes/*.md`)**:
   - Declared in `_config.yml` under `collections.recipes` with `output: true` and `permalink: /receptes/:name/`.
2. **Homepage Catalog (`index.html`)**:
   - Renders all `site.recipes` sorted by date (newest first) or title.
   - Each card includes `data-categories`, `data-tags`, and `data-search` attributes, and pairs with `search.json` for instant filtering.
3. **JSON Search Endpoint (`search.json`)**:
   - A Liquid template with empty frontmatter (`layout: null`) that outputs a valid JSON array of all recipes, including flattened ingredient text, categories, tags, prep/cook times, and URLs.
   - Whenever you add a new metadata field to recipes that should be searchable, expose it in `search.json` using `| jsonify`.
4. **Interactive Recipe Features (`_layouts/recipe.html` & `assets/js/search.js`)**:
   - **Portion Scaler**: Parses leading numbers in `.ingredient-amount` (`data-base-amount`) and scales them by `0.5x`, `1x`, `2x`, or `3x` while keeping `g` and `ml` units intact.
   - **Checklists**: Clicking an ingredient row or instruction step toggles a completed state for easy tracking while cooking.
   - **Screen Wake Lock Toggle (`#wake-lock-toggle`)**: Uses `navigator.wakeLock.request('screen')` (enabled by default and persisted in `localStorage`) with a toggle switch ("Turēt ekrānu ieslēgtu") in `.recipe-meta-bar` so the screen does not dim or lock while cooking. Automatically re-acquires the lock on `visibilitychange`.
   - **Latvian Diacritic Normalization**: Search normalizes Latvian characters (`ā→a`, `č→c`, `ē→e`, `ģ→g`, `ī→i`, `ķ→k`, `ļ→l`, `ņ→n`, `š→s`, `ū→u`, `ž→z`) via `String.prototype.normalize('NFD').replace(/[\u0300-\u036f]/g, '')` so users can search with or without diacritics.
   - **Live Git Commit Version History & In-Page Version Switcher (`#recipe-history-details`)**: Fetches commit history for the current `page.path` (`_recipes/<slug>.md`) from the GitHub REST API (`https://api.github.com/repos/<github_repo>/commits?path=...`). By default, ensures the newest commit (`commits[0]`) is displayed. Clicking any commit ID button (`Atvērt <sha>`) fetches that commit's raw Markdown (`https://raw.githubusercontent.com/<github_repo>/<sha>/_recipes/<slug>.md`), parses its YAML `ingredients` and Markdown instructions, and switches the displayed recipe in-place (with `?versija=<sha>` URL support and a banner to return to the newest version).
   - **Persistent Comments & Improvement Notes (`.recipe-comments-panel`)**: Embeds **Utterances** (GitHub Issues) or **Giscus** (GitHub Discussions) configured via `site.comments` in `_config.yml`.
5. **Page Requests & New Recipe Submissions (`pievienot.html` / `/pievienot/`)**:
   - Accessible from the header navigation button **Pievienot ko jaunu** next to **Visas receptes**.
   - Provides an interactive request builder (`#page-requests-root` in `assets/js/search.js`) that opens a pre-filled GitHub Issue (`pieprasijums` label) for new recipes or site features, and a live board of open/closed requests fetched from GitHub Issues API.

## 3. Git Branching & Deployment Workflow

- **Never commit or push directly to `main`**.
- Create a dedicated branch (`feat/<topic>` or `fix/<topic>`) from latest `origin/main`, commit changes there, and push with `git push -u origin <branch-name>`.
- Provide the branch name and PR creation link (`https://github.com/HermanisV/gurkis.lv/pull/new/<branch-name>`) to the user.
- Merging into `main` triggers `.github/workflows/deploy-pages.yml` to validate recipes, build Jekyll, and deploy to GitHub Pages.

