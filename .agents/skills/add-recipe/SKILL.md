---
name: add-recipe
description: >-
  Use this skill whenever the user wants to add a new recipe or update an existing recipe
  from chat input (notes, freeform text, photos) or from an external web URL/link.
  Guides extraction, metric weight (grams) conversion, Latvian localization, Markdown generation, and validation.
---

# Add or Update Recipe Workflow (`add-recipe`)

Follow this step-by-step procedure whenever the user provides a recipe (via chat text, notes, or external web URL) to add to or update in the Gurķis LV catalog.

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

## Step 3: Translate & Adapt into Idiomatic Latvian

1. Translate the title, short description, ingredient names, group headings, and step-by-step instructions into natural Latvian.
2. Use imperative 2nd-person singular verb forms in preparation steps (e.g., *Uzkarsē cepeškrāsni...*, *Sajauc miltus ar sāli...*, *Cep 25 minūtes...*) for clear, concise kitchen reading.
3. Assign 1–2 primary categories from the standard site categories:
   - `Brokastis`
   - `Zupas`
   - `Pamatēdieni`
   - `Salāti un Uzkodas`
   - `Konditoreja un Deserti`
   - `Mērces un Marinādes`
   - `Dzērieni`
4. Assign 2–6 lowercase Latvian tags (`tags`) covering main ingredients or cooking method (e.g., `vista`, `cepeškrāsns`, `ātri`, `veģetārs`, `biezpiens`).

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

## Step 5: Validate the Recipe

1. Run the validation script from the repository root:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .agents/skills/add-recipe/scripts/validate-recipes.ps1
   ```
2. Fix any reported warnings or errors (missing frontmatter fields, forbidden imperial units, or invalid filenames) before finishing your response.

