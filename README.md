# Gurķis LV — Personīgais Recepšu Katalogs 🥒

GitHub Pages bāzēts recepšu katalogs (Jekyll), kas tiek uzturēts ar repozitorijā iebūvētu AI aģentu (`AGENTS.md` un `.agents/skills/`).

## Galvenie principi
- **Valoda:** Visas receptes un saskarne ir latviešu valodā.
- **Mērvienības:** Stingri metriskā sistēma — sausās un cietās sastāvdaļas **gramos (`g`)**, šķidrumi **mililitros (`ml`)**, temperatūra **Celsija grādos (`°C`)**.
- **Pievienošana ar AI aģentu:** Ieraksti čatā brīvā formā savu recepti vai ielīmē saiti (URL) uz jebkuru ārzemju vai Latvijas recepšu lapu — aģents to iztulkos, pārrēķinās tilpuma mērus (`cups`, `oz`, `tbsp`) uz gramiem un izveidos jaunu lapu `_recipes/` kolekcijā.

## Struktūra
- [`AGENTS.md`](./AGENTS.md) — Vienmēr aktīvie AI aģenta noteikumi.
- [`.agents/skills/`](./.agents/skills/) — AI aģenta specializētās prasmes (`add-recipe`, `update-recipe`, `fetch-issue`, `process-requests`, `work-on-issue`, `gather-recipe-comments`, `maintain-site`).
- [`.agents/mcp_config.example.json`](./.agents/mcp_config.example.json) — GitHub MCP konfigurācijas paraugs.
- `_recipes/*.md` — Recepšu kolekcija.

## Izstrāde un AI Aģenta Vide (GitHub MCP)

Repozitorija AI aģenta prasmes (`fetch-issue`, `process-requests`, `work-on-issue`, `gather-recipe-comments`) saziņai ar GitHub **paļaujas uz oficiālo GitHub MCP serveri** (`@modelcontextprotocol/server-github`).

### Uzstādīšana izstrādātājiem:
1. Pārliecinieties, ka datorā ir uzinstalēts [Node.js](https://nodejs.org/) (ar `npx`).
2. Izveidojiet [GitHub Personal Access Token (PAT)](https://github.com/settings/tokens) ar `repo` piekļuvi.
3. Pievienojiet MCP servera konfigurāciju savā aģenta vidē (Antigravity failā `~/.gemini/config/mcp_config.json` vai Claude Desktop / VS Code):
   - Izmantojiet sagatavi no [`.agents/mcp_config.example.json`](./.agents/mcp_config.example.json).
   - **Windows lietotājiem**: `"command": "cmd.exe"`, `"args": ["/c", "npx", "-y", "@modelcontextprotocol/server-github"]`.
   - **macOS / Linux lietotājiem**: `"command": "npx"`, `"args": ["-y", "@modelcontextprotocol/server-github"]`.
4. Repozitorijā ir iekļauti arī PowerShell rezerves skripti (`.agents/skills/*/scripts/*.ps1`), taču ikdienas darbā aģents primāri izmanto tiešos GitHub MCP rīkus.

