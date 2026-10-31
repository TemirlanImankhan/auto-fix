import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const html = pathToFileURL(path.join(dir, "index.html")).href;
const out = path.join(dir, "Lab1_AutoFix_AI.pdf");

const browser = await chromium.launch({
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage();
await page.goto(html, { waitUntil: "networkidle", timeout: 60000 });
await page.emulateMedia({ media: "print" });
await page.pdf({
  path: out,
  format: "A4",
  printBackground: true,
  margin: { top: "12mm", bottom: "14mm", left: "16mm", right: "12mm" },
  displayHeaderFooter: true,
  headerTemplate: `<div></div>`,
  footerTemplate: `
    <div style="font-size:9px;width:100%;text-align:center;color:#666;font-family:Times,serif;">
      Laboratory Work No. 1 · AutoFix AI · page <span class="pageNumber"></span> of <span class="totalPages"></span>
    </div>`,
});
await browser.close();
console.log("Wrote", out);
