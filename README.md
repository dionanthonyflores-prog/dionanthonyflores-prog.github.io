# Dion Anthony Flores · Software QA Tester

[![Tests](https://github.com/dionanthonyflores-prog/dionanthonyflores-prog.github.io/actions/workflows/tests.yml/badge.svg)](https://github.com/dionanthonyflores-prog/dionanthonyflores-prog.github.io/actions/workflows/tests.yml)

My portfolio: **https://dionanthonyflores-prog.github.io/**

- [Download my CV (PDF)](https://dionanthonyflores-prog.github.io/Dion-Flores-CV.pdf)
- [QA case study: mirou matcha](https://github.com/dionanthonyflores-prog/mirou-matcha/blob/main/qa/README.md): test plan, 54 automated test cases, CI quality gate and defect log for a real ordering website

## What's in this repository

| File | What it is |
| --- | --- |
| `index.html` | The portfolio page: one HTML file, no framework |
| `cv.html` | The source of my CV. `npm run cv` turns it into `Dion-Flores-CV.pdf` |
| `tests/` | Playwright tests for the page (PF-01 to PF-14), run on desktop Chrome, an Android phone and an iPhone |
| `.github/workflows/tests.yml` | Runs the tests on every update and only publishes the page if they all pass |

The page is tested like any other product: no errors or missing files, working links, a CV that downloads, no sideways scrolling on phones, photos that keep their shape, keyboard access, and a **privacy check** that no phone number appears on the page or in the public CV. [Latest test report](https://dionanthonyflores-prog.github.io/report/).

## Run it on your computer

```bash
npm install
npx playwright install chromium webkit
npm run serve      # preview at http://localhost:5175
npm test           # run the tests
```

Contact: dionanthonyflores@gmail.com
