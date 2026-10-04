/**
 * Single-file HTML export: the whole app (JS, CSS, fonts, pdf.js worker) inlined in one
 * `export/index.html`, to open from a disk, a share or an email.
 *
 * It builds the app as a standalone app (POWER_APPS = false in src/lib/app-config.ts, forced here
 * through VITE_STANDALONE): no Power Apps host, so no table pages nor connectors; the home page and
 * the presentations (with their Power BI reports and PDF / PowerPoint exports) work as usual.
 *
 * Usage: npm run build:html
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { build } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "export");

process.env.VITE_STANDALONE = "true";

await build({
  root,
  // Own config: the Power Apps vite plugin is not wanted here.
  configFile: false,
  // Nothing next to the file: the favicon is inlined below.
  publicDir: false,
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: { alias: { "@": path.join(root, "src") } },
  build: {
    outDir,
    emptyOutDir: true,
    // Everything inlined: fonts, images, the pdf.js worker.
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    chunkSizeWarningLimit: Number.MAX_SAFE_INTEGER,
    reportCompressedSize: false,
  },
  logLevel: "warn",
});

// Favicon as a data url (the file must stand alone).
const html = path.join(outDir, "index.html");
const icon = await readFile(path.join(root, "public/power-apps.svg"));
await writeFile(
  html,
  (await readFile(html, "utf8")).replace(
    /href="[^"]*power-apps\.svg"/,
    `href="data:image/svg+xml;base64,${icon.toString("base64")}"`,
  ),
);

console.log(
  `\n✓ Single-file app: ${path.relative(root, path.join(outDir, "index.html"))}`,
);
