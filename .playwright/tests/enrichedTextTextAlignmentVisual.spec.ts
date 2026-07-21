import { test, expect, type Locator, type Page } from '@playwright/test';

test.setTimeout(90_000);

const sel = {
  root: '[data-testid="test-enriched-text-root"]',
  htmlInput: '[data-testid="test-enriched-text-html-input"]',
  setValueButton: '[data-testid="test-enriched-text-set-value-button"]',
  toggleWidthButton: '[data-testid="test-enriched-text-toggle-width-button"]',
  valueOutput: '[data-testid="test-enriched-text-value-output"]',
  display: '[data-testid="test-enriched-text-display"]',
  displayInner: '[data-testid="test-enriched-text-display"] .et-view',
} as const;

function displayLocator(page: Page): Locator {
  return page.locator(sel.display);
}

async function gotoTestEnrichedText(page: Page): Promise<void> {
  await page.goto('/test-enriched-text');
  await page.waitForSelector(sel.displayInner);
  await page.click(sel.toggleWidthButton);
}

async function setEnrichedTextValue(page: Page, html: string): Promise<void> {
  await page.fill(sel.htmlInput, html);
  await page.click(sel.setValueButton);

  await expect
    .poll(async () => (await page.locator(sel.valueOutput).textContent()) ?? '')
    .toBe(html);
}

test.describe('visual: alignments for typography and blocks', () => {
  const cases = [
    {
      name: 'paragraphs with mixed alignments',
      snapshot: 'display-alignment-paragraphs.png',
      html: [
        '<html>',
        '<p style="text-align: left">Left aligned (default)</p>',
        '<p style="text-align: center">Center aligned</p>',
        '<p style="text-align: right">Right aligned</p>',
        '<p style="text-align: justify">Justified alignment. This needs a bit more text to properly visualize the justification spreading across the entire width of the container, ensuring both the left and right edges are perfectly flush against the margins.</p>',
        '</html>',
      ].join(''),
    },
    {
      name: 'headings with mixed alignments',
      snapshot: 'display-alignment-headings.png',
      html: [
        '<html>',
        '<h2 style="text-align: center">H2 Center</h2>',
        '<h4 style="text-align: right">H4 Right</h4>',
        '<h6 style="text-align: left">H6 Left</h6>',
        '</html>',
      ].join(''),
    },
    {
      name: 'blockquotes with independent alignments',
      snapshot: 'display-alignment-blockquotes.png',
      html: [
        '<html>',
        '<blockquote>',
        '<p style="text-align: left">Quote left</p>',
        '<p style="text-align: center">Quote center</p>',
        '<p style="text-align: right">Quote right</p>',
        '</blockquote>',
        '</html>',
      ].join(''),
    },
  ];

  for (const c of cases) {
    test(c.name, async ({ page }) => {
      await gotoTestEnrichedText(page);
      await setEnrichedTextValue(page, c.html);
      await expect(displayLocator(page)).toHaveScreenshot(c.snapshot);
    });
  }
});

test.describe('visual: alignments for all list types', () => {
  const cases = [
    {
      name: 'unordered lists: left, center, right',
      snapshot: 'display-alignment-ul.png',
      html: [
        '<html>',
        '<ul style="text-align: left"><li>Left unordered 1</li><li>Left unordered 2</li></ul>',
        '<ul style="text-align: center"><li>Center unordered 1</li><li>Center unordered 2</li></ul>',
        '<ul style="text-align: right"><li>Right unordered 1</li><li>Right unordered 2</li></ul>',
        '</html>',
      ].join(''),
    },
    {
      name: 'ordered lists: left, center, right',
      snapshot: 'display-alignment-ol.png',
      html: [
        '<html>',
        '<ol style="text-align: left"><li>Left ordered 1</li><li>Left ordered 2</li></ol>',
        '<ol style="text-align: center"><li>Center ordered 1</li><li>Center ordered 2</li></ol>',
        '<ol style="text-align: right"><li>Right ordered 1</li><li>Right ordered 2</li></ol>',
        '</html>',
      ].join(''),
    },
    {
      name: 'checkbox lists: left, center, right',
      snapshot: 'display-alignment-checkbox.png',
      html: [
        '<html>',
        '<ul data-type="checkbox" style="text-align: left"><li checked>Left task 1</li><li>Left task 2</li></ul>',
        '<ul data-type="checkbox" style="text-align: center"><li checked>Center task 1</li><li>Center task 2</li></ul>',
        '<ul data-type="checkbox" style="text-align: right"><li checked>Right task 1</li><li>Right task 2</li></ul>',
        '</html>',
      ].join(''),
    },
    {
      name: 'complex mixed lists and layouts',
      snapshot: 'display-alignment-mixed-lists.png',
      html: [
        '<html>',
        '<p style="text-align: center">A centered paragraph before lists</p>',
        '<ol style="text-align: right"><li>Right ordered</li></ol>',
        '<ul style="text-align: center"><li>Center bullet</li></ul>',
        '<ul data-type="checkbox" style="text-align: right"><li checked>Right checkbox</li></ul>',
        '</html>',
      ].join(''),
    },
  ];

  for (const c of cases) {
    test(c.name, async ({ page }) => {
      await gotoTestEnrichedText(page);
      await setEnrichedTextValue(page, c.html);
      await expect(displayLocator(page)).toHaveScreenshot(c.snapshot);
    });
  }
});
