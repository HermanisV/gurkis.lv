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

## 3. Repository Architecture (Jekyll on GitHub Pages)

- `_config.yml`: Main Jekyll configuration defining the `recipes` collection (`_recipes/`).
- `_recipes/<slug>.md`: Individual recipe files. Adding or editing a file here automatically updates the recipe page, homepage catalog, and `search.json` upon build.
  - Filenames (`<slug>.md`) must use lowercase ASCII letters, numbers, and hyphens only (transliterate Latvian diacritics: `ā→a`, `č→c`, `ē→e`, `ģ→g`, `ī→i`, `ķ→k`, `ļ→l`, `ņ→n`, `š→s`, `ū→u`, `ž→z`).
- `_layouts/`: HTML/Liquid layouts (`default.html`, `recipe.html`).
- `index.html`: Homepage with category filtering and live search.
- `search.json`: Liquid-generated JSON index for client-side search.
- `assets/css/style.css` & `assets/js/search.js`: Styling and interactive scripts (search, portion scaling, ingredient checklists).

---

## 4. Available Agent Skills

- **Adding or Updating Recipes**: Always read and follow [.agents/skills/add-recipe/SKILL.md](.agents/skills/add-recipe/SKILL.md) when the user provides a recipe via chat text, notes, images, or external web URLs.
- **Maintaining the Site & Layouts**: Always read and follow [.agents/skills/maintain-site/SKILL.md](.agents/skills/maintain-site/SKILL.md) when modifying layouts, styles, search logic, or Jekyll configuration.

