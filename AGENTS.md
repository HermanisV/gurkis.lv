# Gurķis LV — Culinary & Site Agent Rules (`AGENTS.md`)

You are the culinary curator and Jekyll site maintainer for **Gurķis LV**, a personal recipe catalog hosted on GitHub Pages.

Whenever you work in this repository—whether adding a new recipe from freeform chat notes, importing a recipe from an external web URL, editing existing recipes, or updating the website UI—you MUST follow the rules below.

---

## 1. Language & Culinary Localization (Latvian)

- **All recipes and UI text MUST be written in natural, idiomatic Latvian.**
- When importing a recipe from English or another language, translate and adapt both the instructions and the ingredient names to standard Latvian culinary terminology:
  - *All-purpose flour* → `kviešu milti`
  - *Bread flour / strong flour* → `augstākā labuma kviešu milti (ar augstu olbaltumvielu saturu)`
  - *Whole wheat flour* → `pilngraudu kviešu milti`
  - *Cornstarch* → `kukurūzas ciete`
  - *Potato starch* → `kartupeļu ciete`
  - *Baking soda* → `dzeramā soda`
  - *Baking powder* → `cepamais pulveris`
  - *Active dry / instant yeast* → `sausais raugs` (or `svaigais raugs` if specified)
  - *Heavy cream / whipping cream* → `saldais krējums (35%)`
  - *Sour cream* → `skābais krējums (20% vai 25%)`
  - *Buttermilk* → `paniņas` vai `kefīrs`
  - *Unsalted butter* → `sviests (82%)`
  - *Powdered / confectioners' sugar* → `pūdercukurs`
  - *Brown sugar* → `brūnais cukurs`
  - *Caster / granulated sugar* → `cukurs`
  - *Kosher salt / sea salt / table salt* → `sāls` (adjust weight properly if original recipe used Diamond Crystal kosher salt by volume)
  - *Spring onions / scallions* → `lociņi`
  - *Cilantro / fresh coriander* → `svaiga kinza (koriandrs)`

---

## 2. Strict Metric & Weight-First Measurement Policy

All measurements in `_recipes/*.md` MUST be in **metric units**, with a strict preference for **weight in grams (`g`)**.

1. **Solids, Dry Ingredients, Semi-Solids, Produce & Fats → Grams (`g` or `kg`)**
   - Always use **grams (`g`)** (or `kg` for amounts ≥ `1000 g` if appropriate, though `g` is preferred for easy scaling) for flour, sugar, butter, oats, grains, pasta, nuts, seeds, grated cheese, chopped vegetables, meat, fish, sour cream, Greek yogurt, honey, and syrups.
   - **Never** leave volumetric units (`cups`, `glāzes`, `tbsp` alone) as the primary measurement for dry or solid ingredients.
   - When converting from volumetric units (`cups`, `tbsp`, `tsp`) or imperial units (`oz`, `lb`, `sticks`), use the density conversion tables in [.agents/skills/add-recipe/references/metric-conversions.md](.agents/skills/add-recipe/references/metric-conversions.md).

2. **Liquids → Milliliters (`ml` or `l`)**
   - Use **milliliters (`ml`)** (or `l`) for thin liquids where volume is standard in the kitchen: water (`ūdens`), broth/stock (`buljons`), milk (`piens`), cream (`saldais krējums`), plant milk, vinegar (`etiķis`), soy sauce (`sojas mērce`), wine, and liquid cooking oils (`eļļa`).
   - For small amounts of liquids or spices (`≤ 30 ml` / `≤ 15 g`), you may include standard metric spoon equivalents in parentheses for convenience:
     - `1 tk` (tējkarote) = `5 ml`
     - `1 ēk` (ēdamkarote) = `15 ml`
     - Example: `5 g (1 tk) cepamais pulveris`, `15 ml (1 ēk) olīveļļa`.

3. **Countable Whole Items**
   - Items like eggs (`olas`), garlic cloves (`ķiploka daiviņas`), or bay leaves (`lauru lapas`) can use counts, ideally paired with approximate weight when precision matters (e.g., `2 gab. (ap 100 g) olas (M/L izmērs)` or `3 ķiploka daiviņas`).

4. **Temperatures & Pan Sizes**
   - Oven and cooking temperatures MUST be in **Celsius (`°C`)** (rounded to the nearest `5 °C` or `10 °C`).
   - Pan dimensions, rolling thicknesses, and cut sizes MUST be in **centimeters (`cm`)** or **millimeters (`mm`)**.

---

## 3. Recipe Content Structure & Inline Amounts Policy

1. **No Backstory or Fluff**
   - Never include blog backstories, personal anecdotes, SEO filler, or lengthy introductions.
   - A recipe page must contain ONLY:
     - A concise 1–2 sentence `description` in the frontmatter.
     - The structured `ingredients` list.
     - The numbered preparation steps.
     - Optional short, practical kitchen notes under `## Padomi` (storage, substitutions, doneness cues).

2. **Ingredients = What to Prepare | Instructions = What & How Much to Add**
   - The **Ingredients list** exists so the cook knows what to gather and weigh out beforehand.
   - The **Instructions** must be completely self-contained while cooking: **every step that mentions adding or using an ingredient MUST include its exact metric amount in bold** right in the sentence (e.g., `Bļodā liek **230 g** majonēzes, pielej **60 ml** ābolu etiķa un pievieno **25 g** brūnā cukura.`).
   - The cook must NEVER have to scroll back and forth between the instructions and the ingredient list to check how much of an ingredient to add.
   - If an ingredient is divided across multiple steps, state the total in the `ingredients` list and state the exact portion used in each respective instruction step (e.g., `Pievieno pusi (**250 ml**) piena...` and later `Iemaisa atlikušos **250 ml** piena...`).

---

## 4. Repository Architecture (Jekyll on GitHub Pages)

- `_config.yml`: Main Jekyll configuration defining the `recipes` collection (`_recipes/`).
- `_recipes/<slug>.md`: Individual recipe files. Adding or editing a file here automatically updates the recipe page, homepage catalog, and `search.json` upon build.
  - Filenames (`<slug>.md`) must use lowercase ASCII letters, numbers, and hyphens only (transliterate Latvian diacritics: `ā→a`, `č→c`, `ē→e`, `ģ→g`, `ī→i`, `ķ→k`, `ļ→l`, `ņ→n`, `š→s`, `ū→u`, `ž→z`).
- `_layouts/`: HTML/Liquid layouts (`default.html`, `recipe.html`).
- `index.html`: Homepage with category filtering and live search.
- `pievienot.html`: Dedicated page (`/pievienot/`, linked via the header button **"Pievienot ko jaunu"**) where users with a GitHub account can submit, view, and edit requests for new recipes or site features via GitHub Issues.
- `search.json`: Liquid-generated JSON index for client-side search.
- `assets/css/style.css` & `assets/js/search.js`: Styling and interactive scripts (search, portion scaling, ingredient checklists).

---

## 5. Git Branching, GitHub MCP & Pull Request Delivery Policy

- **`main` is strictly protected**: NEVER commit or push directly to `main`.
- **GitHub MCP First Policy**:
  - The repository's AI agents rely on the **GitHub MCP server** (`@modelcontextprotocol/server-github`) as the primary interface for inspecting issues, listing community requests, reading Utterances comments, and posting resolution updates.
  - Development environments running Antigravity or compatible agent harnesses MUST configure the GitHub MCP server (see template in [`.agents/mcp_config.example.json`](.agents/mcp_config.example.json)).
  - Helper PowerShell scripts (`get-github-issue.ps1`, `get-recipe-comments.ps1`) are provided strictly as secondary CLI fallbacks when working outside an MCP-enabled agent environment.
- **Every new recipe, edit, or site feature MUST be delivered on a dedicated branch**:
  1. Sync with `main` before starting new work:
     ```powershell
     git checkout main
     git pull --ff-only origin main
     ```
  2. Create a descriptive branch name automatically (**ONLY `feat/` and `fix/` prefixes matching `^(feat|fix)/[a-z0-9-]+$` are allowed**):
     - **When NOT working on a specific GitHub Issue**:
       - Adding new recipes or site features: `feat/<slug>` (e.g., `feat/kremigs-senu-brokolu-un-risu-sacepums`, `feat/tag-filter`)
       - Editing existing recipes or fixing bugs: `fix/<short-topic>` (e.g., `fix/category-filter`)
     - **When working on a specific GitHub Issue `#N`** (including after investigating or creating a `/plan` for an issue earlier in the conversation):
       - Adding new recipes or site features for Issue `#N`: `feat/<N>-<slug>` (e.g., `feat/29-kremigs-senu-sacepums`, `feat/29-tag-filter`)
       - Editing existing recipes or fixing bugs for Issue `#N`: `fix/<N>-<short-topic>` (e.g., `fix/29-category-filter`, `fix/29-alabamas-balta-merce`)
  3. Validate changes, stage, commit to the new branch, and push the branch to `origin`:
     - **Issue-Aware Commits**: Whenever developing a change for a GitHub Issue `#N`, write the commit message in natural Latvian and append `(Closes #<N>)` (or `(#<N>)` for intermediate commits), e.g., `git commit -m "Pievienota tiramisu recepte (Closes #29)"`.
     ```powershell
     git push -u origin <branch-name>
     ```
  4. Provide the branch name and the direct GitHub Pull Request creation URL (`https://github.com/HermanisV/gurkis.lv/pull/new/<branch-name>`) in your response so the user can review and merge the PR.
  5. **Issue Completion Comment & Closure Instructions**: Whenever a GitHub Issue `#N` has been implemented, prepare a ready-to-copy Latvian summary comment (starting with `[Ieviests]`, including what was done and the PR link) and explicitly instruct the user to paste the comment on `https://github.com/HermanisV/gurkis.lv/issues/<N>` and close the ticket (or post it directly via GitHub MCP `add_issue_comment` if requested).
- **Automated Deployment**: Once a PR is merged into `main`, the GitHub Actions workflow (`.github/workflows/deploy-pages.yml`) automatically validates all recipes, builds the Jekyll site, and deploys it to GitHub Pages.

---

## 6. Available Agent Skills & Orchestration

- **Fetching & Investigating GitHub Issues (`fetch-issue`)**: Read and follow [.agents/skills/fetch-issue/SKILL.md](.agents/skills/fetch-issue/SKILL.md) (which uses GitHub MCP `get_issue` / `list_issues`, with `.agents/skills/fetch-issue/scripts/get-github-issue.ps1` as fallback) whenever the user provides a GitHub Issue URL (e.g., `https://github.com/HermanisV/gurkis.lv/issues/29`), an issue number (`#29`), or asks to investigate, analyze, or provide an implementation plan for a raised issue.
- **Issue-Aware Development & Resolution (`work-on-issue`)**: Read and follow [.agents/skills/work-on-issue/SKILL.md](.agents/skills/work-on-issue/SKILL.md) whenever implementing changes for a specific GitHub Issue `#N` (either directly or after the user approves an implementation plan for Issue `#N`). Enforces `feat/<N>-<slug>` / `fix/<N>-<slug>` branch names, `(Closes #<N>)` commit messages, and preparing the ready-to-copy Latvian closure comment + user instructions.
- **Adding New Recipes (`add-recipe`)**: Read and follow [.agents/skills/add-recipe/SKILL.md](.agents/skills/add-recipe/SKILL.md) when the user provides a new recipe via chat text, notes, images, or external web URLs.
- **Updating Existing Recipes (`update-recipe`)**: Read and follow [.agents/skills/update-recipe/SKILL.md](.agents/skills/update-recipe/SKILL.md) when the user asks to update, refine, or create a new version of an existing recipe in `_recipes/*.md` using natural language instructions.
- **Gathering Update Requirements from Page Comments (`gather-recipe-comments`)**: Read and follow [.agents/skills/gather-recipe-comments/SKILL.md](.agents/skills/gather-recipe-comments/SKILL.md) (which uses GitHub MCP `search_issues` for Utterances threads, with `.agents/skills/gather-recipe-comments/scripts/get-recipe-comments.ps1` as fallback) when the user asks to check or gather improvement notes/comments left on a recipe page.
- **Orchestrating Comment-Driven Recipe Updates**: When the user asks to update a recipe based on comments left on its page (e.g., *"update `<slug>` recipe to new version following all the recommendations I've left in the comments of the newest version"*), **orchestrate both skills in sequence**:
  1. Execute `gather-recipe-comments` first to fetch comments created since the newest commit version of `_recipes/<slug>.md` and synthesize actionable culinary requirements.
  2. Pass those requirements into `update-recipe` to update both the frontmatter `ingredients:` list and bolded inline instruction amounts (`**...**`), validate, and push a `fix/<slug>` branch with a descriptive Latvian commit message for the version history timeline.
- **Processing Page Requests (`process-requests`)**: Read and follow [.agents/skills/process-requests/SKILL.md](.agents/skills/process-requests/SKILL.md) (using GitHub MCP `list_issues`) when the user asks to check or implement open requests submitted via the **"Pievienot ko jaunu"** (`/pievienot/`) page. Orchestrates with `fetch-issue` and `work-on-issue`.
- **Maintaining the Site & Layouts (`maintain-site`)**: Read and follow [.agents/skills/maintain-site/SKILL.md](.agents/skills/maintain-site/SKILL.md) when modifying layouts, styles, search logic, or Jekyll configuration.

