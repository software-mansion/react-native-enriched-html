import { test, expect, type Locator, type Page } from '@playwright/test';

test.setTimeout(90_000);

type EllipsizeMode = 'head' | 'middle' | 'tail' | 'clip';

const sel = {
  root: '[data-testid="test-ellipsize-root"]',
  display: '[data-testid="test-ellipsize-display"]',
  displayInner: '[data-testid="test-ellipsize-display"] .et-view',
  htmlInput: '[data-testid="test-ellipsize-html-input"]',
  setValueButton: '[data-testid="test-ellipsize-set-value-button"]',
  numberOfLinesInput: '[data-testid="test-ellipsize-number-of-lines-input"]',
  numberOfLinesOutput: '[data-testid="test-ellipsize-number-of-lines-output"]',
  modeButton: (mode: EllipsizeMode) =>
    `[data-testid="test-ellipsize-mode-${mode}"]`,
  modeOutput: '[data-testid="test-ellipsize-mode-output"]',
  valueOutput: '[data-testid="test-ellipsize-value-output"]',
} as const;

const LONG_PARAGRAPH =
  '<html><p>This is a fairly long paragraph that should wrap across several lines so the truncation has something to chew on. Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p></html>';

const MULTI_BLOCK =
  '<html><h4>Title that is long enough to wrap onto more than one line in the box</h4><p>First paragraph with some content.</p><ul><li>Alpha item</li><li>Beta item</li><li>Gamma item</li></ul></html>';

function displayLocator(page: Page): Locator {
  return page.locator(sel.display);
}

async function gotoTestEllipsize(page: Page): Promise<void> {
  await page.goto('/test-ellipsize');
  await page.waitForSelector(sel.displayInner);
}

async function setValue(page: Page, html: string): Promise<void> {
  await page.fill(sel.htmlInput, html);
  await page.click(sel.setValueButton);
  await expect
    .poll(async () => (await page.locator(sel.valueOutput).textContent()) ?? '')
    .toBe(html);
}

async function setNumberOfLines(page: Page, lines: number): Promise<void> {
  await page.fill(sel.numberOfLinesInput, String(lines));
  await expect
    .poll(
      async () =>
        (await page.locator(sel.numberOfLinesOutput).textContent())?.trim() ??
        ''
    )
    .toBe(String(lines));
}

async function setMode(page: Page, mode: EllipsizeMode): Promise<void> {
  await page.click(sel.modeButton(mode));
  await expect
    .poll(
      async () =>
        (await page.locator(sel.modeOutput).textContent())?.trim() ?? ''
    )
    .toBe(mode);
}

// 'middle' is excluded - it is not implemented on web and falls back to 'tail',
// so it would just duplicate the 'tail' snapshots
const MODES: EllipsizeMode[] = ['head', 'tail', 'clip'];

// Cases run for every ellipsize mode. Add a new entry here to have it
// exercised across all four modes (it.each-style table).
type EllipsizeCase = {
  name: string;
  // used to build the per-mode screenshot name: `ellipsize-<slug>-<mode>.png`
  slug: string;
  html: string;
  numberOfLines: number;
};

const SHARED_CASES: EllipsizeCase[] = [
  {
    name: 'long paragraph clamped to 2 lines',
    slug: 'paragraph-2-lines',
    html: LONG_PARAGRAPH,
    numberOfLines: 2,
  },
  {
    name: 'long paragraph clamped to 1 line',
    slug: 'paragraph-1-line',
    html: LONG_PARAGRAPH,
    numberOfLines: 1,
  },
  {
    name: 'multi-block content clamped to 3 lines',
    slug: 'multi-block-3-lines',
    html: MULTI_BLOCK,
    numberOfLines: 3,
  },
];

for (const mode of MODES) {
  test.describe(`EnrichedText ellipsize - ${mode}`, () => {
    for (const c of SHARED_CASES) {
      test(c.name, async ({ page }) => {
        await gotoTestEllipsize(page);
        await setValue(page, c.html);
        await setNumberOfLines(page, c.numberOfLines);
        await setMode(page, mode);

        await expect(displayLocator(page)).toHaveScreenshot(
          `ellipsize-${c.slug}-${mode}.png`
        );
      });
    }
  });
}

// mode-independent: with no line limit the full content is rendered
test.describe('EnrichedText ellipsize - no clamp', () => {
  test('numberOfLines 0 renders the full content', async ({ page }) => {
    await gotoTestEllipsize(page);
    await setValue(page, LONG_PARAGRAPH);
    await setNumberOfLines(page, 0);

    await expect(displayLocator(page)).toHaveScreenshot(
      'ellipsize-paragraph-no-clamp.png'
    );
  });
});
