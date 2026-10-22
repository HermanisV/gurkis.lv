---
name: update-recipe
description: >-
  Use this skill whenever the user wants to update, refine, or create a new version of an
  existing recipe in _recipes/*.md following natural language instructions (either directly
  from chat or orchestrated from the gather-recipe-comments skill). Ensures metric weight
  consistency across frontmatter ingredients and inline bolded instruction amounts, validates,
  and delivers a descriptive version commit on a dedicated branch.
---

# Update Existing Recipe to a New Version (`update-recipe`)

Follow this procedure whenever the user wants to modify an existing recipe in `_recipes/<slug>.md` using natural language instructions, or after gathering recommendations via [`gather-recipe-comments`](../gather-recipe-comments/SKILL.md).

---

## Step 0: Check if Requirements Must Be Gathered from Page Comments First

- If the user asks to update a recipe based on **comments left on the recipe page** (e.g., *"update `alabamas-balta-merce` recipe to new version following all the recommendations I've left in the comments of the newest version"*), **FIRST** read and run [.agents/skills/gather-recipe-comments/SKILL.md](../gather-recipe-comments/SKILL.md) to collect the structured update requirements, then continue with Step 1 below.

---

## Step 1: Sync with `main` & Read the Target Recipe

1. Ensure your local repository is synced with `origin/main` and create a dedicated update branch (`fix/<slug>`):
   ```powershell
   git fetch origin
   git checkout -B main origin/main
   git checkout -b fix/<slug>
   ```
2. Read the existing recipe file `_recipes/<slug>.md` completely.

---

## Step 2: Apply Natural Language Instructions Consistently

When applying the requested changes to `_recipes/<slug>.md`, you MUST update every affected section in lockstep:

1. **Metric & Weight-First Conversion**
   - All solid/dry/semi-solid ingredient changes MUST be in **grams (`g`)**; thin liquids MUST be in **milliliters (`ml`)**.
   - For small quantities (`≤ 15 g` or `≤ 30 ml`), include optional Latvian spoon equivalents (`1 tk` = `5 ml`, `1 ēk` = `15 ml`) only if appropriate (e.g., `5 ml (1 tk)`). If a changed liquid quantity is no longer a clean spoon multiple (e.g., `40 ml` ābolu etiķis), write `40 ml` cleanly without awkward fractional spoons.
   - Consult [.agents/skills/add-recipe/references/metric-conversions.md](../add-recipe/references/metric-conversions.md) whenever converting volumetric or imperial descriptions.

2. **Frontmatter `ingredients:` List AND Inline Instruction Amounts (`**...**`)**
   - **Rule of Total Synchronization**: Every ingredient amount in the `ingredients:` YAML list MUST match the bolded inline amounts (`**...**`) in the numbered preparation steps.
   - Whenever you change an ingredient's quantity in `ingredients:`, locate every occurrence of that ingredient in the numbered preparation steps (and in `## Padomi` if referenced) and update its bolded amount (`**...**`) to match.
   - If an ingredient is divided across multiple steps, ensure the sum of the bolded step amounts equals the total in `ingredients:`.

3. **Frontmatter Metadata & Culinary Notes (`## Padomi`)**
   - Update `date:` to the current date (`YYYY-MM-DD`) so the catalog reflects the newly updated recipe version.
   - Update `prep_time`, `cook_time`, `servings`, or `description` if affected by the instructions.
   - If the natural language instruction or comment explains *why* a change improved the dish (e.g., *"40ml etiķis ir labāk. mērce sanāk biezāka."*), incorporate that practical insight naturally into the steps or `## Padomi` while keeping zero fluff.

---

## Step 3: Validate the Updated Recipe

Run the validation script from the repository root to verify frontmatter structure, metric units, and slug rules:
```powershell
powershell -ExecutionPolicy Bypass -File .agents/skills/add-recipe/scripts/validate-recipes.ps1
```
Fix any validation errors or warnings before committing.

---

## Step 4: Commit with a Clear Latvian Version Summary & Push

Because the recipe page's **Versiju vēsture** panel fetches and displays Git commit messages directly to the user on the website, write the commit message in **clear, natural Latvian** summarizing what changed in this new version:

1. Stage, commit, and push the `fix/<slug>` branch:
   ```powershell
   git add _recipes/<slug>.md
   git commit -m "<Concise Latvian summary of the recipe update, e.g.: Alabamas baltā mērce: samazināts ābolu etiķis uz 40 ml biezākai konsistencei>"
   git push -u origin fix/<slug>
   ```
2. Provide the user with:
   - A concise summary of the changes applied (both in `ingredients` and inline instructions).
   - The branch name (`fix/<slug>`) and direct Pull Request URL (`https://github.com/HermanisV/gurkis.lv/pull/new/fix/<slug>`).
