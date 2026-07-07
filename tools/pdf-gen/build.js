const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

const ROOT = path.join(__dirname, "..", "..");
const LOGO_BLACK = "file://" + path.join(ROOT, "assets", "logos", "iconicwall-logo-black.svg").replace(/\\/g, "/");
const LOGO_WHITE = "file://" + path.join(ROOT, "assets", "logos", "iconicwall-logo-white.svg").replace(/\\/g, "/");

const DOCUMENTS = [
  {
    template: "scheda-prodotto.html",
    output: path.join(ROOT, "downloads", "iconicwall-scheda-prodotto.pdf"),
  },
];

async function buildDocument(browser, doc) {
  const templatePath = path.join(__dirname, "templates", doc.template);
  let html = fs.readFileSync(templatePath, "utf8");
  html = html.replaceAll("{{LOGO_BLACK}}", LOGO_BLACK).replaceAll("{{LOGO_WHITE}}", LOGO_WHITE);

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  await page.pdf({
    path: doc.output,
    format: "A4",
    printBackground: true,
    margin: { top: 0, bottom: 0, left: 0, right: 0 },
  });
  await page.close();
  const size = (fs.statSync(doc.output).size / 1024 / 1024).toFixed(2);
  console.log(`Generato: ${doc.output} (${size} MB)`);
}

(async () => {
  const browser = await puppeteer.launch();
  for (const doc of DOCUMENTS) {
    await buildDocument(browser, doc);
  }
  await browser.close();
})();
