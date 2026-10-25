---
name: work-on-issue
description: >-
  Use this skill whenever developing, committing, or completing a change for a specific
  GitHub Issue (#N), including when executing an approved implementation plan for an issue.
  Enforces issue-prefixed branch names (feat/<N>-<slug> or fix/<N>-<slug>), issue-linked
  Latvian commit messages ((Closes #<N>)), and prepares a ready-to-copy Latvian issue comment
  with instructions for the user to post it and close the ticket.
---

# Issue-Aware Development & Completion (`work-on-issue`)

Follow this workflow whenever you are implementing changes tied to a specific GitHub Issue `#<IssueNumber>` (whether started directly from an issue request or after the user approves an implementation plan created with [`fetch-issue`](../fetch-issue/SKILL.md)).

---

## Step 1: Ensure Issue Context & Create Issue-Prefixed Branch

1. If you have not yet fetched the details of Issue `#<IssueNumber>` in this conversation, first run [`fetch-issue`](../fetch-issue/SKILL.md) (calling `get_issue` via GitHub MCP, or running `get-github-issue.ps1 -Issue <IssueNumber>` as fallback).
2. Sync with `origin/main` and create a dedicated branch that includes `<IssueNumber>` immediately after `feat/` or `fix/`:
   - **New recipe or new site feature**: `feat/<IssueNumber>-<slug>`
     - Examples: `feat/29-kremigs-senu-sacepums`, `feat/29-gatavosanas-taimeris`
   - **Bug fix, UI tweak, or existing recipe update**: `fix/<IssueNumber>-<short-topic>`
     - Examples: `fix/29-category-filter`, `fix/29-alabamas-balta-merce`
   - **Constraint**: The branch name MUST only contain lowercase ASCII letters, digits, and hyphens matching `^(feat|fix)/[a-z0-9-]+$` (enforced by `.github/workflows/deploy-pages.yml`).

   ```powershell
   git checkout main
   git pull --ff-only origin main
   git checkout -b <feat|fix>/<IssueNumber>-<slug>
   ```

---

## Step 2: Implement & Validate Changes via Domain Skill

Depending on the issue's scope, execute the corresponding domain skill while keeping `#<IssueNumber>` active:

1. **Adding a New Recipe (`new-recipe`)**:
   - Follow [`.agents/skills/add-recipe/SKILL.md`](../add-recipe/SKILL.md).
   - Convert all measurements to metric (`g` / `ml` / `°C`), write natural Latvian with bolded inline amounts (`**...**`) in every step, create `_recipes/<slug>.md`, and validate with `.agents/skills/add-recipe/scripts/validate-recipes.ps1`.
2. **Updating an Existing Recipe (`recipe-update`)**:
   - Follow [`.agents/skills/update-recipe/SKILL.md`](../update-recipe/SKILL.md).
   - Synchronize frontmatter `ingredients:` and inline bolded instruction amounts (`**...**`), update `date:`, and validate with `.agents/skills/add-recipe/scripts/validate-recipes.ps1`.
3. **Website Feature, Layout, Search, or Bug Fix (`site-change` / `bug`)**:
   - Follow [`.agents/skills/maintain-site/SKILL.md`](../maintain-site/SKILL.md).
   - Preserve GitHub Pages `--safe` compatibility and validate recipes if any recipe templates or scripts were touched.

---

## Step 3: Commit with Issue Reference & Push Branch

1. **Write an Issue-Aware Commit Message in Natural Latvian**:
   - Always include `(Closes #<IssueNumber>)` at the end of the commit message (or `(#<IssueNumber>)` on intermediate commits and `(Closes #<IssueNumber>)` on the final commit):
     - New recipe example:
       ```powershell
       git commit -m "Pievienota tiramisu recepte (Closes #29)"
       ```
     - Recipe update example (displayed in the recipe page's **Versiju vēsture** timeline):
       ```powershell
       git commit -m "Alabamas baltā mērce: samazināts ābolu etiķis uz 40 ml biezākai konsistencei (Closes #29)"
       ```
     - Site feature / bug fix example:
       ```powershell
       git commit -m "Pievienots gatavošanas soļu taimeris (Closes #29)"
       ```
2. **Push the Branch to `origin`**:
   ```powershell
   git push -u origin <branch-name>
   ```

---

## Step 4: Prepare Issue Comment & Instruct the User to Close the Ticket

Provide the user with the PR link, a ready-to-copy Latvian comment, and optional automated posting via GitHub MCP:

1. **Pull Request Creation Link**:
   - Direct link: `https://github.com/HermanisV/gurkis.lv/pull/new/<branch-name>`
2. **Ready-to-Copy Latvian Comment for the GitHub Issue**:
   - Present a clean markdown code block that the user can copy and paste directly into `https://github.com/HermanisV/gurkis.lv/issues/<IssueNumber>`:
     ````markdown
     [Ieviests] Izmaiņas ir sagatavotas zarā `<branch-name>`!

     - **Paveiktais:** <Īss 1–2 teikumu kopsavilkums latviešu valodā par pievienoto recepti vai lapas izmaiņām>
     - **Pull Request saite:** https://github.com/HermanisV/gurkis.lv/pull/new/<branch-name>
     ````
   *(Note: Starting the comment with `[Ieviests]` ensures that if the issue is linked to a recipe page's comment log, the website UI automatically badges it as `✓ Ieviests`.)*
   - If GitHub MCP is active and the user requests automated posting, post the comment directly with MCP tool `add_issue_comment`.
3. **Clear Next-Step Instructions for the User**:
   - Instruct the user to:
     1. Open the Pull Request link (`https://github.com/HermanisV/gurkis.lv/pull/new/<branch-name>`) to review and merge the branch into `main`.
     2. Open the GitHub Issue (`https://github.com/HermanisV/gurkis.lv/issues/<IssueNumber>`), paste the prepared comment above, and click **"Close issue"** (or let merging the PR with `Closes #<IssueNumber>` close it automatically after adding the comment).
