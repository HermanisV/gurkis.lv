---
name: process-requests
description: >-
  Use this skill whenever the user asks to check, read, or implement open requests submitted
  via the "Pievienot ko jaunu" (/pievienot/) page on Gurķis LV (GitHub Issues).
  Guides fetching open requests, orchestrating work-on-issue (with add-recipe, update-recipe,
  or maintain-site), using issue-prefixed branches, linking "(Closes #<issue>)" in commits,
  and preparing a Latvian closure comment with instructions for the user.
---

# Process Page Requests (`process-requests`)

Use this skill whenever the user asks to check or implement requests submitted via the **"Pievienot ko jaunu"** (`/pievienot/`) button/page (e.g., *"check new requests"*, *"implement open requests from the page"*, or *"implement request #22"*).
For investigating or creating an implementation plan for a specific GitHub Issue URL or `#N`, use [`fetch-issue`](../fetch-issue/SKILL.md) directly.

---

## Step 1: Read Open Page Requests from GitHub

### Primary Method: GitHub MCP Server (Recommended)

1. When the GitHub MCP server is active, call `list_issues` (`ServerName: "github"`, `ToolName: "list_issues"`):
   ```json
   {
     "owner": "HermanisV",
     "repo": "gurkis.lv",
     "state": "open"
   }
   ```
2. Filter for user requests submitted via `/pievienot/` (issues with label `pieprasijums` or titled `[Jauna recepte]` / `[Lapas uzlabojums]`, excluding Utterances comment threads).
3. For an individual issue `#N`, call `get_issue` (`ServerName: "github"`, `ToolName: "get_issue"`) with `owner: "HermanisV"`, `repo: "gurkis.lv"`, `issue_number: N`.

### Fallback Method: Helper PowerShell Script

If GitHub MCP is not active, run the issue/request fetcher script from the repository root:
- **To fetch all open requests** (default):
  ```powershell
  powershell -ExecutionPolicy Bypass -File .agents/skills/fetch-issue/scripts/get-github-issue.ps1 -State open
  ```
- **To fetch a specific issue by URL or number** (e.g. `#22` or `https://github.com/HermanisV/gurkis.lv/issues/22`):
  ```powershell
  powershell -ExecutionPolicy Bypass -File .agents/skills/fetch-issue/scripts/get-github-issue.ps1 -Issue 22
  ```
2. Review each returned request:
   - `IssueNumber`: The GitHub Issue number (`#N`).
   - `IssueType` / `RequestType`:
     - `new-recipe`: A request to add a new recipe (from a URL, freeform text, or notes).
     - `recipe-update`: A request to update an existing recipe in `_recipes/<slug>.md`.
     - `site-change` / `bug` / `general-issue`: A request to add or modify a site feature, layout, style, or configuration.

---

## Step 2: Implement Each Request via `work-on-issue`

Read and follow [`.agents/skills/work-on-issue/SKILL.md`](../work-on-issue/SKILL.md) for each issue `#<IssueNumber>` being implemented:

1. **New Recipe (`new-recipe`)**:
   - Read and follow [.agents/skills/add-recipe/SKILL.md](../add-recipe/SKILL.md).
   - Extract the recipe from the provided URL or notes, convert all measurements to metric (`g` / `ml` / `°C`), translate into natural Latvian with bolded inline amounts (`**...**`) in every step, create `_recipes/<slug>.md`, and validate with `.agents/skills/add-recipe/scripts/validate-recipes.ps1`.
   - Use issue-prefixed branch: `feat/<IssueNumber>-<slug>`.

2. **Existing Recipe Update (`recipe-update`)**:
   - Read and follow [.agents/skills/update-recipe/SKILL.md](../update-recipe/SKILL.md).
   - Use issue-prefixed branch: `fix/<IssueNumber>-<slug>`.

3. **Website Feature or UI Change (`site-change` / `bug` / `general-issue`)**:
   - Read and follow [.agents/skills/maintain-site/SKILL.md](../maintain-site/SKILL.md).
   - Implement the requested layout, style, or JavaScript changes while preserving GitHub Pages `--safe` compatibility.
   - Use issue-prefixed branch: `feat/<IssueNumber>-<short-topic>` or `fix/<IssueNumber>-<short-topic>`.

---

## Step 3: Commit, Push & Prepare Closure Comment for the User

1. **Include `(Closes #<IssueNumber>)` in the Git Commit Message**:
   - When committing the implementation on the `feat/<IssueNumber>-...` or `fix/<IssueNumber>-...` branch, append `(Closes #<IssueNumber>)` to the natural Latvian commit message (e.g., `git commit -m "Pievienota tiramisu recepte (Closes #22)"`).
2. **Push the Branch**:
   ```powershell
   git push -u origin <branch-name>
   ```
3. **Prepare the Issue Comment & Closure Instructions for the User**:
   - Prepare a ready-to-copy Latvian comment block (starting with `[Ieviests]`, summarizing what was done, and linking to `https://github.com/HermanisV/gurkis.lv/pull/new/<branch-name>`).
   - If GitHub MCP is available and the user requests automated commenting, you may post the comment directly using MCP tool `add_issue_comment`:
     ```json
     {
       "owner": "HermanisV",
       "repo": "gurkis.lv",
       "issue_number": <IssueNumber>,
       "body": "[Ieviests] Izmaiņas ir sagatavotas zarā `<branch-name>`!\n\n- **Paveiktais:** ...\n- **Pull Request saite:** https://github.com/HermanisV/gurkis.lv/pull/new/<branch-name>"
     }
     ```
   - Instruct the user to:
     1. Review and merge the PR via `https://github.com/HermanisV/gurkis.lv/pull/new/<branch-name>`.
     2. Open `https://github.com/HermanisV/gurkis.lv/issues/<IssueNumber>` and close the ticket (merging the PR with `(Closes #<IssueNumber>)` will also auto-close it once merged into `main`).
