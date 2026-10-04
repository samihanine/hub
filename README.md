# Hub — Power Apps Code App template

A general-purpose internal hub, hosted in Power Apps as a **Code App**: a home page of shortcuts, Excel-backed
tables (a small CMS) and interactive presentations built around Power BI reports. Nothing in it is specific to a
business domain: rename, recolour and fill it for your own team.

Vite + React + TypeScript + Tailwind 4 + shadcn/ui + TanStack Router / Query + motion.
Data goes through the **Excel Online (Business)** and **SharePoint** connectors.

| Page          | URL                                              | File to edit                                |
| ------------- | ------------------------------------------------ | ------------------------------------------- |
| Home          | `#/`                                             | `src/lib/app-config.ts` (title + shortcuts) |
| Tables        | `#/tables?name=task&role=read` (or `role=write`) | `src/tables/*.ts`                           |
| Presentations | `#/presentation?name=guide` (`&slide=5`)         | `src/presentations/*.ts`                    |

Without a connector, the app runs in **demo mode**: rows come from each table's `sample` and are stored in the browser.

## Getting started

```bash
npm install
npm run dev          # http://localhost:5173 (demo mode outside Power Apps)
```

Admin emails go in `ADMINS` (`src/lib/app-config.ts`): they see the `adminOnly` shortcuts and can be used as table
`writers`. Outside Power Apps, the app runs as the first admin (to test `role=write` locally).

## Standalone single-file HTML

```bash
npm run build:html   # → export/index.html (not committed)
```

`scripts/build-html.mjs` builds the whole app into one HTML file (JS, CSS, fonts, pdf.js worker inlined, about
6.5 MB) to open from a disk, a share or an email. It builds as a **standalone app**: `POWER_APPS` (in
`src/lib/app-config.ts`) is forced to false, so there is no Power Apps host, no connectors and no table pages; the
table shortcuts disappear from the home page (and empty shortcut groups are hidden). Home and presentations work as
usual, including the Power BI reports and the PDF / PowerPoint exports.

Set `POWER_APPS_ENABLED = false` in `src/lib/app-config.ts` to get the same standalone behaviour in the normal build.

## Power Platform environment (`pa` CLI)

The CLI is a devDependency (`@microsoft/power-apps-cli`), exposed through npm scripts:

```bash
npm run pa:login                 # Entra ID sign-in (browser)
npx pa app init --display-name "Hub" --environment-id <ENV_ID>   # once → power.config.json
npm run pa:add-excel             # adds the Excel Online (Business) connector (pick the connection)
npm run pa:add-sharepoint        # optional: link resolution and image uploads to SharePoint
npm run dev                      # the vite plugin prints the URL to test INSIDE the Power Apps host
npm run pa:push                  # build + publish
```

After `pa:add-excel`, the generated `dataSourcesInfo.ts` is picked up automatically (`src/lib/power-apps.ts`) and
the app switches to **connector** mode. `FORCE_DEMO = true` (`src/lib/app-config.ts`) forces demo mode.

The target environment must allow code apps: Power Platform admin center → Environments → _your environment_ →
Settings → Product → Features → **Enable code apps** (needs the System Administrator role in that environment).
End users need a Power Apps Premium licence.

## Linking a table to an Excel workbook

An existing workbook is enough. On first access the app:

- creates the sheet and the table (named `excel.table`) with the **`id`** key column and one column per field, if missing;
- appends the missing columns to an existing table (never deletes or moves one);
- adds `id` (filled for existing rows) if missing.

```ts
excel: { url: "<any link to the workbook>", table: "Tasks" },
images: { url: "<link to a folder>" },               // optional
writers: ["first.last@company.com"],                 // "*" = everyone
```

Accepted links: sharing links (`/:x:/g/…`, `/:f:/…`), Office web links (`Doc.aspx?sourcedoc={GUID}`), direct paths
(`https://x.sharepoint.com/sites/team/Shared Documents/file.xlsx`). The drive and file are resolved at runtime through
the **SharePoint** connector ("Send an HTTP request" on `_api/v2.0`) and cached in the browser. `source` is `"me"` for
your own OneDrive, otherwise the site URL; `source` / `drive` / `file` can still be set by hand.

Table page: title and actions on one line (row count, sort, fields, **list** / **table** layout, refresh, open in
Excel, and with `role=write`: **CSV import** and add), search and filters on the full width, KPI strip (rows per
value of `kpi.field`, click = filter).

- List layout: rows on the left (`defaultColumns` under the title, editable through "Fields"), details on the right
  (read-only with `role=read`, form with `role=write`). Default sort: `sort: { column, direction }`.
- Table layout: every column (horizontal scroll), select rows or all the rows shown → "Copy" (tab-separated text,
  pastes as a table in Excel / Teams) and "Delete" with `role=write`.
- CSV import (`csv-import.tsx`, `src/lib/csv.ts`): `,` `;` or tab delimiter detected, columns matched by name /
  label (editable), values converted (options by value or label, yes/no, "2,5" numbers, dd/mm/yyyy dates, multiple
  values separated by `;` or `|`), rows appended at the end of the table.

Field types: `string`, `text` (**bold**, line breaks), `number`, `boolean`, `option`, `date`, `url`, `image`
(+ `multiple: true` → values separated by `;` in Excel). Filters, sort and visible columns are saved in localStorage.

## Presentations

- **Content**: `src/presentations/<name>.ts` — a flat list of slides, each with its `layout`. The (optional)
  `section` and `subsection` slides give the structure: the outline, the side panel and the trail derive from them.
- **Layouts**: one file per layout in `src/features/presentation/layouts/` (visual + type of its parameters):
  `cover` · `plan` (automatic) · `section` · `subsection` · `quote` · `markdown` · `rectangles` (2–4 cards) ·
  `cards` (3×2 grid, KPIs) · `list` (≤ 8 points) · `visual` (cropped report, optional `crop` = whole page) ·
  `compare` (before / after) · `report` (lead band + whole report page, full width, scrollable) · `faq`.
- **Lead band**: content slides (all but cover, plan, section, subsection and quote) have a required `lead`, the key
  sentence shown in the band at the top (`LeadBand` in `ui.tsx`). `lead` is a text, or `{ text, icon, color }` to
  pick the lucide icon (a chart by default) and its colour (gold by default).
- **Step-by-step reveal**: on `plan`, `rectangles`, `cards`, `list`, `visual` (points) and `faq`, items appear one
  at a time on each click / → key (← hides them), then the next slide comes (`steps` option of a layout, `define.ts`).
- **Report**: `reportUrl` (Power BI embed URL), `report` per slide for another page (`&pageName=…`),
  `crop: { x, y, w, h }` in px of a 1280×720 page (key **C** to calibrate). A single report iframe is kept for the
  whole presentation (signed in once, no reload between slides).
- **PDF export**: "Export to PDF" in the side panel → print view (every slide, everything revealed, no animation, one
  slide per page) → "Save as PDF": each report is first shown on screen (Power BI only draws what is visible), then
  the print dialog opens.
- **PowerPoint export**: "PowerPoint" in the print view → `.pptx` rebuilt with native, editable text boxes and shapes
  (`pptx-export.ts`, `pptxgenjs`). Power BI reports cannot be read by the page (cross-origin): drop the PDF exported
  from the print view, pdf.js draws its pages and each report is cut out at its position on the slide
  (`capture.ts`). The flowers are turned into PNGs from their SVG. Without a PDF, reports stay linked placeholders.
- Text: `**bold**`, `*italic*`, `==accent==`; markdown (`## `, `### `, `- `, `> `) in `markdown`, `rectangles` and
  subsection descriptions.
- Keyboard: ← → / space / click, **S** side panel, **F** full screen, **C** calibrate, Esc leave.
- Hovering a logo, a monogram letter or a flower replays its appearance animation.

## Shared code (`src/lib`)

| File                             | Role                                                                                                                                                                         |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app-config.ts`                  | App name, brand mark of the presentations (`BRAND_MARK`: whole word as the logo, first letter alone on slides; optional `BRAND_MARK_SIZE`), admins, home title and shortcuts |
| `power-apps.ts`                  | Power Apps SDK: connectors, demo mode, current user                                                                                                                          |
| `sharepoint.ts`                  | OneDrive / SharePoint links → ids                                                                                                                                            |
| `excel.ts`                       | Creating / completing the Excel tables                                                                                                                                       |
| `rows.ts`                        | Reading / writing rows (Excel or demo) + `useRows` hook                                                                                                                      |
| `table-view.ts`                  | Search, filters, sort and columns of a table                                                                                                                                 |
| `csv.ts`                         | CSV parsing, value conversion, copy as tab-separated text                                                                                                                    |
| `use-local-state.ts`, `utils.ts` | Utilities                                                                                                                                                                    |

## Visual identity

Ivory `#F8F4EC` surfaces, gold accent `#B08D57`, ink `#26221D`, hairlines, square corners (tokens in `src/index.css`).
Embedded fonts (`src/fonts`, `@font-face` in `src/index.css`): **Futura Bk BT** for titles (`font-title`, a single
Book weight) and **Century Gothic** for text (Light → Bold, italics). The animated brand mark (`monogram.tsx`) uses
Bodoni Moda; the toile de Jouy flowers are in `toile.tsx`. Change the tokens, fonts and `BRAND_MARK` to match your
own identity.

Deep link from the Power Apps player: `…/play/<appId>?page=tables&name=task&role=write`.
