const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const pages = ["index.html", "about.html", "textiles.html", "contact.html"];
const errors = [];
let links = 0;

for (const page of pages) {
  const html = fs.readFileSync(path.join(root, page), "utf8");
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  if (new Set(ids).size !== ids.length) errors.push(`${page}: duplicate element IDs`);
  if ((html.match(/<h1\b/g) || []).length !== 1) errors.push(`${page}: expected one main heading`);
  if (!html.includes('aria-label="Primary navigation"')) errors.push(`${page}: missing labelled navigation`);

  for (const match of html.matchAll(/\b(?:src|href|srcset)="([^"]+)"/g)) {
    const value = match[1];
    if (/^(https?:|mailto:|tel:|data:)/.test(value)) continue;
    const [location, hash] = value.split("#");
    const filename = location.split("?")[0] || page;
    const target = path.resolve(root, filename);
    if (!target.startsWith(root + path.sep) || !fs.existsSync(target)) {
      errors.push(`${page}: missing local target ${value}`);
      continue;
    }
    if (hash && filename.endsWith(".html")) {
      const targetHtml = fs.readFileSync(target, "utf8");
      if (!targetHtml.includes(`id="${hash}"`)) errors.push(`${page}: missing anchor ${value}`);
    }
    links++;
  }

  for (const match of html.matchAll(/mailto:([^"\s]+)/g)) {
    if (match[1] !== "info@mantrix.ae") errors.push(`${page}: unexpected enquiry recipient`);
  }
  for (const match of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\balt="[^"]*"/.test(match[0])) errors.push(`${page}: image needs alternative text`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Checked ${pages.length} pages and ${links} local references: assets, anchors, headings, image alt text, and email addresses passed.`);
}
