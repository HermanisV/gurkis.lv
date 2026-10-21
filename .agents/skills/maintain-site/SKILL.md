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
   - **Latvian Diacritic Normalization**: Search normalizes Latvian characters (`ā→a`, `č→c`, `ē→e`, `ģ→g`, `ī→i`, `ķ→k`, `ļ→l`, `ņ→n`, `š→s`, `ū→u`, `ž→z`) via `String.prototype.normalize('NFD').replace(/[\u0300-\u036f]/g, '')` so users can search with or without diacritics.

