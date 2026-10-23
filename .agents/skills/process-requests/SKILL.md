---
name: process-requests
description: >-
  Use this skill whenever the user asks to check, read, implement, or close requests submitted
  via the "Pievienot ko jaunu" (/pievienot/) page on Gurķis LV (GitHub Issues).
  Guides fetching open requests, orchestrating add-recipe or maintain-site,
  linking "Closes #<issue>" in commits/PRs, and closing completed requests on GitHub.
---

# Process Page Requests (`process-requests`)

Use this skill whenever the user asks to check, implement, or close requests submitted via the **"Pievienot ko jaunu"** (`/pievienot/`) button/page (e.g., *"check new requests"*, *"implement open requests from the page and close them"*, or *"implement request #22"*).

---

## Step 1: Read Open Page Requests from GitHub

1. Run the request harvester script from the repository root:
   - **To fetch all open requests** (default):
     ```powershell
     powershell -ExecutionPolicy Bypass -File .agents/skills/process-requests/scripts/get-page-requests.ps1 -State open
     ```
   - **To fetch a specific issue by number** (e.g. `#22`):
     ```powershell
     powershell -ExecutionPolicy Bypass -File .agents/skills/process-requests/scripts/get-page-requests.ps1 -IssueNumber 22
     ```
2. Review each returned request:
   - `IssueNumber`: The GitHub Issue number (`#N`).
   - `RequestType`:
     - `new-recipe`: A request to add a new recipe (from a URL, freeform text, or notes).
     - `site-change` / `general-request`: A request to add or modify a site feature, layout, style, or configuration.

---

## Step 2: Implement Each Request by Orchestrating the Matching Skill

Depending on the `RequestType` and content of the request:

1. **New Recipe (`new-recipe`)**:
   - Read and follow [.agents/skills/add-recipe/SKILL.md](../add-recipe/SKILL.md).
   - Extract the recipe from the provided URL or notes, convert all measurements to metric (`g` / `ml` / `°C`), translate into natural Latvian with bolded inline amounts (`**...**`) in every step, create `_recipes/<slug>.md`, and validate with `.agents/skills/add-recipe/scripts/validate-recipes.ps1`.
   - Use branch `feat/<slug>`.

2. **Website Feature or UI Change (`site-change` / `general-request`)**:
   - Read and follow [.agents/skills/maintain-site/SKILL.md](../maintain-site/SKILL.md).
   - Implement the requested layout, style, or JavaScript changes while preserving GitHub Pages `--safe` compatibility.
   - Use branch `feat/<short-topic>` or `fix/<short-topic>`.

---

## Step 3: Commit, Push & Close the Request

1. **Include `Closes #<IssueNumber>` in the Git Commit Message**:
   - When committing the implementation on the `feat/...` or `fix/...` branch, append `Closes #<IssueNumber>` to the commit message (e.g., `git commit -m "Pievienota tiramisu recepte (Closes #22)"`) so GitHub links the commit/PR to the request and automatically closes it on merge if not already closed.
2. **Push the Branch**:
   ```powershell
   git push -u origin <branch-name>
   ```
3. **Close the Request Issue with a Latvian Summary Comment**:
   - When the user asks to implement and close the request, run `close-page-request.ps1` to post a friendly Latvian comment (including the branch name and PR creation link `https://github.com/HermanisV/gurkis.lv/pull/new/<branch-name>`) and mark the GitHub Issue as closed:
     ```powershell
     powershell -ExecutionPolicy Bypass -File .agents/skills/process-requests/scripts/close-page-request.ps1 -IssueNumber <IssueNumber> -Comment "Pieprasījums ieviests zarā `<branch-name>`! PR saite: https://github.com/HermanisV/gurkis.lv/pull/new/<branch-name>"
     ```
4. Report the completed request(s), branch name(s), and PR link(s) to the user.
