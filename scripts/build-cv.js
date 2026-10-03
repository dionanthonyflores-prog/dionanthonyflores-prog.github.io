// Turns cv.html into PDF files:
//   Dion-Flores-CV.pdf                      public copy (email and city, no phone) — published on the website
//   private/Dion-Flores-CV-with-phone.pdf   private copy with the phone number — stays on this laptop
// The phone number is read from private/phone.txt. The private/ folder is git-ignored, so it is never uploaded.
// Run it with:  npm run cv
const { chromium } = require("@playwright/test");
const fs = require("fs"), path = require("path"), { pathToFileURL } = require("url");

const root = path.join(__dirname, "..");
const pages = file => (fs.readFileSync(file, "latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(pathToFileURL(path.join(root, "cv.html")).href, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.emulateMedia({ media: "print" });
  const pdf = file => page.pdf({ path: file, format: "A4", printBackground: true, preferCSSPageSize: true });

  const publicCv = path.join(root, "Dion-Flores-CV.pdf");
  await pdf(publicCv);
  console.log(`Public CV:  ${path.relative(root, publicCv)} (${pages(publicCv)} page(s), no phone number)`);

  const phoneFile = path.join(root, "private", "phone.txt");
  if (fs.existsSync(phoneFile)) {
    const phone = fs.readFileSync(phoneFile, "utf8").trim();
    await page.evaluate(p => { const li = document.getElementById("phone"); li.textContent = p; li.hidden = false; }, phone);
    const privateCv = path.join(root, "private", "Dion-Flores-CV-with-phone.pdf");
    await pdf(privateCv);
    console.log(`Private CV: ${path.relative(root, privateCv)} (${pages(privateCv)} page(s), with phone number; not uploaded)`);
  } else {
    console.log("No private/phone.txt, so only the public CV was made.");
  }
  await browser.close();
})();
