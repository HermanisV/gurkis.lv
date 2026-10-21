# Gurķis LV — Personīgais Recepšu Katalogs 🥒

GitHub Pages bāzēts recepšu katalogs (Jekyll), kas tiek uzturēts ar repozitorijā iebūvētu AI aģentu (`AGENTS.md` un `.agents/skills/`).

## Galvenie principi
- **Valoda:** Visas receptes un saskarne ir latviešu valodā.
- **Mērvienības:** Stingri metriskā sistēma — sausās un cietās sastāvdaļas **gramos (`g`)**, šķidrumi **mililitros (`ml`)**, temperatūra **Celsija grādos (`°C`)**.
- **Pievienošana ar AI aģentu:** Ieraksti čatā brīvā formā savu recepti vai ielīmē saiti (URL) uz jebkuru ārzemju vai Latvijas recepšu lapu — aģents to iztulkos, pārrēķinās tilpuma mērus (`cups`, `oz`, `tbsp`) uz gramiem un izveidos jaunu lapu `_recipes/` kolekcijā.

## Struktūra
- [`AGENTS.md`](./AGENTS.md) — Vienmēr aktīvie AI aģenta noteikumi.
- [`.agents/skills/add-recipe/SKILL.md`](./.agents/skills/add-recipe/SKILL.md) — Darbplūsma jaunu recepšu pievienošanai, pārrēķināšanai gramos un validācijai.
- [`.agents/skills/maintain-site/SKILL.md`](./.agents/skills/maintain-site/SKILL.md) — Darbplūsma lapas dizaina un meklēšanas uzturēšanai.
- `_recipes/*.md` — Recepšu kolekcija.

