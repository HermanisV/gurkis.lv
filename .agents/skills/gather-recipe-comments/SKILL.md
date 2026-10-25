---
name: gather-recipe-comments
description: >-
  Use this skill to gather recipe update requirements, feedback, and improvement notes
  left in the comments (Utterances / GitHub Issues) of a Gurķis LV recipe page.
  Compares comment timestamps against the recipe's newest Git commit version and extracts
  actionable culinary change requirements to pass into the update-recipe skill.
---

# Gather Recipe Update Requirements from Page Comments (`gather-recipe-comments`)

Use this skill whenever the user asks to check, review, or apply recommendations/comments left on a recipe page (e.g., *"update `alabamas-balta-merce` recipe to new version following all the recommendations I've left in the comments of the newest version"*).

---

## Step 1: Identify the Target Recipe Slug

1. Determine the recipe `<slug>` from the user's request:
   - If the user provides a slug directly (e.g., `alabamas-balta-merce`), use `alabamas-balta-merce`.
   - If the user provides a full URL (e.g., `https://hermanisv.github.io/gurkis.lv/receptes/alabamas-balta-merce/`), extract `alabamas-balta-merce`.
   - If the user provides a Latvian title (e.g., *Alabamas baltā mērce*), match it to the corresponding file in `_recipes/<slug>.md`.

---

## Step 2: Fetch Comments & Version Metadata

### Primary Method: GitHub MCP Server (Recommended)

When GitHub MCP is available, retrieve the recipe's Utterances comment thread directly:

1. **Find Utterances Issue for Recipe**:
   - Utterances stores comments as GitHub issues with title `receptes/<slug>`.
   - Call MCP tool `search_issues` (`ServerName: "github"`, `ToolName: "search_issues"`):
     ```json
     {
       "q": "repo:HermanisV/gurkis.lv is:issue in:title receptes/<slug>"
     }
     ```
2. **Review Comments on the Issue**:
   - Read the comments using the issue number found.
   - Compare comment timestamps with the latest recipe commit (or git history) to identify comments left since the latest recipe update.

### Fallback Method: Helper PowerShell Script

If GitHub MCP is not active, run the comment harvester script from the repository root:

- **To fetch only comments left since the newest commit version of the recipe** (default when user asks for comments on the newest version):
  ```powershell
  powershell -ExecutionPolicy Bypass -File .agents/skills/gather-recipe-comments/scripts/get-recipe-comments.ps1 -Slug "<slug>" -OnlyNewestVersion
  ```
- **To fetch all historical comments across all versions** (when the user asks for all comments regardless of version):
  ```powershell
  powershell -ExecutionPolicy Bypass -File .agents/skills/gather-recipe-comments/scripts/get-recipe-comments.ps1 -Slug "<slug>"
  ```
2. Review the script output:
   - `Latest Version`: Shows the current version number (`vN`), short commit SHA, and commit timestamp of `_recipes/<slug>.md` on `main`.
   - Each comment entry includes `[NEWEST VERSION]` or `[OLDER VERSION]`, author, timestamp, source URL, and the full comment text.

---

## Step 3: Synthesize Actionable Update Requirements

1. Parse the natural-language observations in the retrieved comments into concrete recipe change requirements:
   - **Ingredient quantity adjustments**: e.g., *"40ml etiķis ir labāk. mērce sanāk biezāka."* → Change `ābolu etiķis` amount to `40 ml` in both the frontmatter `ingredients` list and the inline bolded instruction step (`**40 ml**`), and note the thicker consistency in the instructions or `## Padomi`.
   - **New or removed ingredients**: Identify exact metric weight (`g`) or volume (`ml`) to add/remove.
   - **Cooking time, temperature, or technique changes**: Identify changes to `prep_time`, `cook_time`, oven temperature (`°C`), or step wording.
   - **Kitchen tips / storage notes**: Extract observations on texture, flavor balance, or substitutions for the `## Padomi` section.
2. If no `[NEWEST VERSION]` comments exist (or if comments conflict with one another), report this clearly to the user and ask for confirmation before modifying the recipe.

---

## Step 4: Orchestrate with `update-recipe`

- When the user's goal is to **update the recipe** based on the comments:
  1. Immediately read and execute [.agents/skills/update-recipe/SKILL.md](../update-recipe/SKILL.md), passing the synthesized update requirements from Step 3 as the natural-language update instructions.
  2. Reference the comment(s) applied in your final response (and in the Git commit message so the recipe's **Versiju vēsture** timeline clearly records what changed in the new version).
