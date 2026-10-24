---
name: fetch-issue
description: >-
  Use this skill whenever the user references a GitHub Issue URL (e.g.,
  https://github.com/HermanisV/gurkis.lv/issues/29), an issue number (#29), or asks to
  fetch, investigate, analyze, or provide an implementation plan for a raised GitHub Issue.
  Fetches issue metadata, body, extracted URLs, and comments, and establishes active issue
  context (#N, branch name, and commit suffix) for planning and implementation.
---

# Fetch & Investigate GitHub Issues (`fetch-issue`)

Use this skill whenever the user asks to inspect, investigate, plan, or work on a raised GitHub Issue—for example:
- *"Investigate and provide implementation plan for https://github.com/HermanisV/gurkis.lv/issues/29"*
- *"/plan https://github.com/HermanisV/gurkis.lv/issues/29"*
- *"Check issue #29 and implement it"*
- *"List open GitHub issues"*

---

## Step 1: Fetch the Issue Details from GitHub

Run `get-github-issue.ps1` from the repository root:

- **To fetch a specific issue by full URL or issue number**:
  ```powershell
  powershell -ExecutionPolicy Bypass -File .agents/skills/fetch-issue/scripts/get-github-issue.ps1 -Issue "https://github.com/HermanisV/gurkis.lv/issues/29"
  ```
  *(You may also pass `-Issue "#29"` or `-Issue "29"`.)*

- **To list all open issues** (excluding Utterances comment threads by default):
  ```powershell
  powershell -ExecutionPolicy Bypass -File .agents/skills/fetch-issue/scripts/get-github-issue.ps1 -State open
  ```

---

## Step 2: Establish Active Issue Context

From the script output, lock in the following **Active Issue Context** for the remainder of the conversation (across both planning and code execution):

1. **Issue Number & URL**: `#<IssueNumber>` (`https://github.com/HermanisV/gurkis.lv/issues/<IssueNumber>`)
2. **Issue Classification (`IssueType`)**:
   - `new-recipe`: Request to add a new recipe (from an external URL or freeform notes in the issue body/comments).
   - `recipe-update`: Request to modify or improve an existing recipe in `_recipes/<slug>.md`.
   - `site-change` / `bug` / `general-issue`: Request to add a website feature, update UI/layouts/search, or fix a bug.
3. **Issue-Aware Branch Name (Mandatory)**:
   - Every branch created for Issue `#<IssueNumber>` MUST include the issue number right after the `feat/` or `fix/` prefix:
     - New recipe or new site feature: `feat/<IssueNumber>-<slug>` (e.g., `feat/29-kremigs-senu-sacepums` or `feat/29-print-button`)
     - Bug fix, UI adjustment, or recipe update: `fix/<IssueNumber>-<short-topic>` (e.g., `fix/29-category-filter` or `fix/29-alabamas-balta-merce`)
   - Must match `^(feat|fix)/[a-z0-9-]+$` enforced by `.github/workflows/deploy-pages.yml`.
4. **Issue-Aware Commit Suffix (Mandatory)**:
   - Commit messages for this issue MUST be written in natural Latvian and include `(Closes #<IssueNumber>)` (or `(#<IssueNumber>)` for intermediate commits), e.g.:
     `Pievienota tiramisu recepte (Closes #29)`

---

## Step 3: Investigate & Formulate Implementation Plan (or Proceed to Execution)

### Case A: User Asked to Investigate or Provide an Implementation Plan (`/plan` or Investigation Prompt)

1. **Research the Target**:
   - If `Extracted URLs` contains an external recipe link (for `new-recipe`), fetch/read that recipe source so you can verify ingredients, metric conversions, and Latvian translation details.
   - If the issue targets an existing recipe (`_recipes/<slug>.md`) or site files (`_layouts/`, `assets/css/style.css`, `assets/js/search.js`, `index.html`, `pievienot.html`), read the relevant files to understand the exact changes needed.
   - Review all issue comments (`Comments`) in case follow-up clarifications or scope adjustments were added after the original issue description.
2. **Write the Implementation Plan**:
   - In your implementation plan (or investigation response), ALWAYS include a dedicated **Git & Issue Delivery (`#<IssueNumber>`)** section specifying:
     - **Active Issue**: `#<IssueNumber>` (`<Issue Title>`)
     - **Target Branch**: `feat/<IssueNumber>-<slug>` or `fix/<IssueNumber>-<slug>`
     - **Target Commit Message**: `<Concise Latvian summary> (Closes #<IssueNumber>)`
     - **Post-Implementation Step**: Prepare a ready-to-copy Latvian summary comment and instruct the user to post it on Issue `#<IssueNumber>` and close the ticket (via [`work-on-issue`](../work-on-issue/SKILL.md)).
   - Wait for user approval before modifying repository files if in `/plan` mode.

### Case B: User Asked to Implement the Issue Directly (or Approved the Plan)

- Immediately read and follow [`.agents/skills/work-on-issue/SKILL.md`](../work-on-issue/SKILL.md) to execute the change on `feat/<IssueNumber>-<slug>` or `fix/<IssueNumber>-<slug>`, commit with `(Closes #<IssueNumber>)`, push the branch, and prepare the Latvian closure comment + instructions for the user.
