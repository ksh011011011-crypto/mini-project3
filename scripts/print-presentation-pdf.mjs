import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const htmlPath = path.join(root, "docs", "sehyeon-presentation.html");
const pdfPath = path.join(root, "docs", "세현-복합단지-발표.pdf");

if (!fs.existsSync(htmlPath)) {
  console.error("Missing:", htmlPath);
  process.exit(1);
}

const fileUrl = pathToFileURL(htmlPath).href;

const edgeCandidates = [
  process.env.LOCALAPPDATA
    ? path.join(
        process.env.LOCALAPPDATA,
        "Microsoft",
        "Edge",
        "Application",
        "msedge.exe",
      )
    : null,
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean);

for (const edge of edgeCandidates) {
  if (!fs.existsSync(edge)) continue;
  const r = spawnSync(
    edge,
    ["--headless=new", "--disable-gpu", `--print-to-pdf=${pdfPath}`, fileUrl],
    { stdio: "inherit", windowsHide: true },
  );
  if (r.status === 0 && fs.existsSync(pdfPath)) {
    console.log("PDF:", pdfPath);
    process.exit(0);
  }
}

console.error(
  "Edge headless PDF failed. Open docs/sehyeon-presentation.html and use Print → Save as PDF.",
);
process.exit(1);
