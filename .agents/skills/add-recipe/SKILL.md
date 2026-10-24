---
name: add-recipe
description: >-
  Use this skill whenever the user wants to add a new recipe from chat input (notes, freeform
  text, photos) or from an external web URL/link. Guides extraction, metric weight (grams)
  conversion, Latvian localization, Markdown generation, and validation. (For updating an
  existing recipe, use the update-recipe skill.)
---

# Add Recipe Workflow (`add-recipe`)

Follow this step-by-step procedure whenever the user provides a new recipe (via chat text, notes, or external web URL) to add to the Gurķis LV catalog. If the user wants to update an existing recipe in `_recipes/*.md`, use [.agents/skills/update-recipe/SKILL.md](../update-recipe/SKILL.md) (and [.agents/skills/gather-recipe-comments/SKILL.md](../gather-recipe-comments/SKILL.md) if updating from page comments).

## Step 1: Acquire & Parse the Recipe Source

### Case A: External Web Resource (URL)
1. Fetch the recipe page content (using web search / URL reading tools).
2. Strip away blog narratives, ads, and unrelated commentary.
3. Extract:
   - Original title & brief culinary concept
   - Yield / number of servings (`servings`)
   - Prep time (`prep_time`) and cook/bake time (`cook_time`) in minutes
   - Complete ingredient list (preserving logical groups such as "Mīklai", "Pildījumam", "Mērcei")
   - Step-by-step preparation instructions and chef tips/notes
   - Save the exact URL for the `source_url` frontmatter field.

### Case B: Freeform Chat Input / User Notes
1. Parse the ingredients, quantities, and cooking method described by the user.
2. If the user gives rough descriptions or omits minor standard details (such as prep time or exact oven temperature for a standard bake), infer sensible culinary defaults and note them clearly for the user, or ask a brief clarifying question if a critical ratio is ambiguous.
3. Leave `source_url: ""` (or set `source_name: "Paša recepte"` if appropriate).

---

## Step 2: Convert All Measurements to Metric (Weight-First in Grams)

1. Read the conversion reference table:
   [metric-conversions.md](./references/metric-conversions.md)
2. Convert every imperial or volumetric measurement (`cups`, `oz`, `lb`, `sticks`, `fl oz`, `tbsp`, `tsp`, `glāze`) according to these rules:
   - **Solids, powders, grains, grated cheese, butter, chopped vegetables, meats, thick dairy (sour cream, yogurt), honey/syrups**: Convert to **grams (`g`)**.
   - **Thin liquids (water, milk, broth, liquid cream, oil, vinegar, soy sauce)**: Convert to **milliliters (`ml`)**.
   - **Small spoon quantities (`≤ 15 g` or `≤ 30 ml`)**: Provide the weight in grams (`g`) or volume in milliliters (`ml`) first, optionally followed by Latvian spoon notation in parentheses: e.g., `5 g (1 tk) sāls`, `15 ml (1 ēk) citrona sula`.
   - **Temperatures**: Convert `°F` to `°C` (rounded to nearest `5 °C` or `10 °C`).
   - **Dimensions**: Convert `inches` to `cm` (`1 inch ≈ 2.5 cm`).
3. Round converted gram weights to clean, kitchen-friendly numbers:
   - Under `20 g`: round to nearest `1 g` (or `0.5 g` for yeast/spices).
   - `20 g` – `100 g`: round to nearest `5 g`.
   - Over `100 g`: round to nearest `5 g` or `10 g`.

---

## Step 3: Translate & Adapt into Idiomatic Latvian (Zero Fluff + Inline Amounts)

1. **Zero Backstory**: Omit all blog stories, history, or filler text. Keep only the ingredients, the numbered preparation steps, and concise practical storage/serving notes (`## Padomi`).
2. **Translate to Idiomatic Latvian**: Translate the title, short description, ingredient names, group headings, and step-by-step instructions into natural Latvian. Use clear cooking verb forms (e.g., *Uzkarsē cepeškrāsni...*, *Sajauc...*, *Pievieno...*).
3. **Mandatory Inline Ingredient Amounts in Instructions**:
   - The **Ingredients list** tells the user what to prepare; the **Instructions** tell the user what and how much to add.
   - **Every instruction step that mentions adding or combining an ingredient MUST include its metric amount in bold** (e.g., `Vidējā bļodā liek **230 g** majonēzes, pielej **60 ml** ābolu etiķa, **5 ml (1 tk)** citrona sulas un pievieno **25 g (2 ēk)** brūnā cukura...`).
   - Never write vague steps like *"Add the sugar, mustard, and spices"* without repeating their exact amounts in that step—the reader must never need to scroll back to the ingredient list while cooking.
   - Use decimals (e.g., `0.5 tk`, `1.5 g`) rather than slash fractions (`1/2`) inside `amount` and bolded instruction amounts (`**...**`), because the interactive portion scaler (`0.5×`, `1×`, `2×`, `3×`) automatically multiplies both the ingredient panel amounts and the bolded inline amounts in the instructions!
4. Assign 1–2 primary categories from the standard site categories:
   - `Brokastis`
   - `Zupas`
   - `Pamatēdieni`
   - `Sacepums`
   - `Mīkla`
   - `Salāti un Uzkodas`
   - `Konditoreja un Deserti`
   - `Mērces un Marinādes`
   - `Dzērieni`
5. Assign 2–6 lowercase Latvian tags (`tags`) covering main ingredients or cooking method (e.g., `vista`, `cepeškrāsns`, `ātri`, `veģetārs`, `biezpiens`, `mērce`, `grils`).

---

## Step 4: Create the Recipe File in `_recipes/`

1. Read the canonical recipe template:
   [recipe-template.md](./resources/recipe-template.md)
2. Generate an ASCII slug from the Latvian title:
   - Lowercase only, words separated by `-`.
   - Transliterate Latvian diacritics: `ā→a, č→c, ē→e, ģ→g, ī→i, ķ→k, ļ→l, ņ→n, š→s, ū→u, ž→z`.
   - Example: *Kraukšķīgi vistas šķiņķīši* → `_recipes/kraukskigi-vistas-skinkisi.md`.
3. Write the recipe file to `_recipes/<slug>.md`.
   - Make sure every numeric quantity in `amount` starts with a number (e.g., `"250 g"`, `"15 ml (1 ēk)"`, `"2 gab."`) so the interactive portion scaler on the recipe page can dynamically multiply amounts!

---

## Step 5: Validate & Deliver via Feature Branch

1. Run the validation script from the repository root:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .agents/skills/add-recipe/scripts/validate-recipes.ps1
   ```
2. Fix any reported warnings or errors (missing frontmatter fields, forbidden imperial units, or invalid filenames) before committing.
3. **Never commit or push directly to `main` (only `feat/` and `fix/` branches are allowed)**:
   - **If NOT working on a GitHub Issue**:
     - Create branch `feat/<slug>` from latest `origin/main` and commit in natural Latvian:
       ```powershell
       git checkout -b feat/<slug>
       git add _recipes/<slug>.md
       git commit -m "Pievienota <recipe title> recepte"
       git push -u origin feat/<slug>
       ```
     - Report the branch name (`feat/<slug>`) and PR link (`https://github.com/HermanisV/gurkis.lv/pull/new/feat/<slug>`) to the user.
   - **If working on a GitHub Issue `#<IssueNumber>`** (followed via [`work-on-issue`](../work-on-issue/SKILL.md)):
     - Include the issue number in the branch name (`feat/<IssueNumber>-<slug>`) and append `(Closes #<IssueNumber>)` to the commit message:
       ```powershell
       git checkout -b feat/<IssueNumber>-<slug>
       git add _recipes/<slug>.md
       git commit -m "Pievienota <recipe title> recepte (Closes #<IssueNumber>)"
       git push -u origin feat/<IssueNumber>-<slug>
       ```
     - Provide the PR link (`https://github.com/HermanisV/gurkis.lv/pull/new/feat/<IssueNumber>-<slug>`), prepare a ready-to-copy Latvian comment block (starting with `[Ieviests]`), and instruct the user to post the comment on `https://github.com/HermanisV/gurkis.lv/issues/<IssueNumber>` and close the ticket.

