// Tests for the portfolio page. Each name starts with its test-case ID (PF-xx).
import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';
import { pdfText } from './pdf-text';

const EMAIL = 'dionanthonyflores@gmail.com';
const SECTIONS = ['project', 'how', 'skills', 'experience', 'contact'];
// Philippine mobile numbers like +63 9xx xxx xxxx or 09xx-xxx-xxxx
const PHONE = /(\+63|\b0)\s?9\d{2}[\s-]?\d{3}[\s-]?\d{4}/;

async function scrollThroughPage(page: Page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 500) {
    await page.evaluate(y => window.scrollTo(0, y), y);
    await page.waitForTimeout(60);
  }
  await page.waitForLoadState('networkidle');
}

test.beforeEach(async ({ page }) => {
  await page.goto('./');
});

test('PF-01 the page loads with no errors and no missing files', async ({ page }) => {
  const problems: string[] = [];
  page.on('pageerror', e => problems.push(`script error: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') problems.push(`console error: ${m.text()}`); });
  page.on('response', r => { if (r.status() >= 400) problems.push(`${r.status()} ${r.url()}`); });
  await page.reload();
  await expect(page).toHaveTitle('Dion Anthony Flores · Software QA Tester');
  await scrollThroughPage(page);
  expect(problems).toEqual([]);
});

test('PF-02 the main heading and summary say who I am and what I do', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toHaveText("Hi, I'm Dion. I find the bugs before your customers do.");
  await expect(page.locator('.eyebrow').first()).toContainText('Software QA Tester');
  await expect(page.locator('.lead')).toContainText('Almost 4 years');
});

test('PF-03 "Download CV" gives the PDF', async ({ page }) => {
  const download = page.waitForEvent('download');
  await page.locator('.hero').getByRole('link', { name: 'Download CV (PDF)' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('Dion-Flores-CV.pdf');
});

test('PF-04 the CV file is a real PDF, and every CV link points to it', async ({ page }) => {
  const res = await page.request.get('Dion-Flores-CV.pdf');
  expect(res.status()).toBe(200);
  const body = await res.body();
  expect(body.subarray(0, 5).toString()).toBe('%PDF-');
  expect(body.length, 'a CV should be more than a few bytes').toBeGreaterThan(30_000);
  const cvLinks = page.locator('a[href$=".pdf"]');
  await expect(cvLinks).toHaveCount(3);
  for (const link of await cvLinks.all()) await expect(link).toHaveAttribute('href', 'Dion-Flores-CV.pdf');
});

// The privacy checks only report yes/no. A failing "not.toMatch" would print the text it searched,
// and on a public repository that would put the phone number in a public test log.
test('PF-05 privacy: no phone number on the page or in the public CV', async ({ page }) => {
  const hasPhone = (text: string) => PHONE.test(text);
  expect(hasPhone(await page.locator('body').innerText()), 'phone number on the page').toBe(false);
  expect(hasPhone(await (await page.request.get('./')).text()), 'phone number in the page source').toBe(false);
  // cv.html is the source of the public PDF; the phone is only ever added to the private copy
  const cvSource = await (await page.request.get('cv.html')).text();
  expect(hasPhone(cvSource), 'phone number in cv.html').toBe(false);
  expect(cvSource).toContain('<li id="phone" hidden></li>');
  expect(cvSource).toContain('Available upon request');

  // The PDF itself, as people download it
  const cvText = await pdfText(await (await page.request.get('Dion-Flores-CV.pdf')).body());
  expect(cvText.includes(EMAIL) && cvText.includes('Calamba'), 'control: the PDF text was really read').toBe(true);
  // A PDF can store "+63 939 ..." as separate pieces, so compare the digits with all spacing removed
  const digits = cvText.replace(/[\s\-–.()]/g, '');
  expect(/(\+?63|0)9\d{9}/.test(digits), 'phone number in the public CV PDF').toBe(false);
});

test('PF-06 the email button opens an email to me', async ({ page }) => {
  await expect(page.getByRole('link', { name: EMAIL })).toHaveAttribute('href', `mailto:${EMAIL}`);
});

test('PF-07 the project links lead to pages that exist', async ({ page }) => {
  const links = page.locator('#project a[href^="https://"]');
  expect(await links.count()).toBeGreaterThanOrEqual(5);
  for (const link of await links.all()) {
    const url = (await link.getAttribute('href'))!;
    const res = await page.request.get(url);
    // GitHub sometimes rate-limits automated visitors (429); anything else must be a working page
    expect([200, 429], `${url} should open`).toContain(res.status());
  }
});

test('PF-08 every photo loads and has a description', async ({ page }) => {
  await scrollThroughPage(page);
  const photos = await page.evaluate(() => [...document.images].map(i => ({ src: i.getAttribute('src'), alt: i.alt, ok: i.complete && i.naturalWidth > 0 })));
  expect(photos.length).toBeGreaterThan(0);
  for (const p of photos) {
    expect(p.ok, `${p.src} should load`).toBe(true);
    expect(p.alt.trim(), `${p.src} should have a description`).not.toBe('');
  }
});

test('PF-09 photos keep their shape (not stretched)', async ({ page }) => {
  for (const img of await page.locator('img').all()) {
    await img.scrollIntoViewIfNeeded();
    const s = await img.evaluate((i: HTMLImageElement) => ({ src: i.getAttribute('src'), w: i.getBoundingClientRect().width, h: i.getBoundingClientRect().height }));
    expect(s.h / s.w, `${s.src} should be 16:10`).toBeCloseTo(10 / 16, 1);
  }
});

test('PF-10 nothing sticks out sideways (no left-right scrolling)', async ({ page }) => {
  await scrollThroughPage(page);
  const { pageWidth, screenWidth } = await page.evaluate(() => ({ pageWidth: document.documentElement.scrollWidth, screenWidth: innerWidth }));
  expect(pageWidth).toBeLessThanOrEqual(screenWidth);
});

test('PF-11 desktop: each menu link goes to its section', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Phones show only the CV button in the header');
  for (const id of SECTIONS) {
    await page.locator(`header nav a[href="#${id}"]`).click();
    // The section reaches the top of the screen, or (for the last section) the page has scrolled as far as it can
    await expect.poll(() => page.evaluate(id => {
      const top = document.getElementById(id)!.getBoundingClientRect().top;
      const atBottom = scrollY + innerHeight >= document.documentElement.scrollHeight - 2;
      return top < 120 || (atBottom && top < innerHeight);
    }, id), { message: `#${id} should come into view` }).toBe(true);
  }
});

test('PF-12 phones: the header keeps the CV button and hides the menu links', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Phone layout only');
  await expect(page.locator('header nav ul')).toBeHidden();
  await expect(page.locator('header').getByRole('link', { name: 'CV' })).toBeVisible();
});

test('PF-13 the share preview is set for Facebook, Messenger and LinkedIn', async ({ page }) => {
  const meta = (selector: string) => page.locator(selector).getAttribute('content');
  expect(await meta('meta[property="og:url"]')).toBe('https://dionanthonyflores-prog.github.io/');
  expect(await meta('meta[property="og:image"]')).toBe('https://dionanthonyflores-prog.github.io/images/share.jpg');
  const size = await page.evaluate(() => new Promise<string>(resolve => {
    const img = new Image(); img.onload = () => resolve(`${img.naturalWidth}x${img.naturalHeight}`); img.src = 'images/share.jpg';
  }));
  expect(size).toBe('1200x630');
});

test('PF-14 keyboard: the first Tab shows "Skip to content", which jumps to the main content', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Keyboard navigation is checked on desktop');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main$/);
});
