import { test, expect, type Locator, type Page } from '@playwright/test';

test.setTimeout(90_000);

const sel = {
  root: '[data-testid="test-enriched-text-root"]',
  htmlInput: '[data-testid="test-enriched-text-html-input"]',
  setValueButton: '[data-testid="test-enriched-text-set-value-button"]',
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
}

async function setEnrichedTextValue(page: Page, html: string): Promise<void> {
  await page.fill(sel.htmlInput, html);
  await page.click(sel.setValueButton);
  // The display mirrors the value through the output node; wait until applied.
  await expect
    .poll(async () => (await page.locator(sel.valueOutput).textContent()) ?? '')
    .toBe(html);
}

test.describe('EnrichedText display visual regression', () => {
  const cases: { name: string; snapshot: string; html: string }[] = [
    {
      name: 'rich text: heading, bold, italic and link',
      snapshot: 'enriched-text-rich-text.png',
      html: [
        '<html>',
        '<h3>Heading</h3>',
        '<p>Some <b>bold</b> and <i>italic</i> text.</p>',
        '<p>A <a href="https://example.com">link</a> here.</p>',
        '</html>',
      ].join(''),
    },
    {
      name: 'unordered list',
      snapshot: 'enriched-text-unordered-list.png',
      html: '<html><ul><li>Alpha</li><li>Beta</li><li>Gamma</li></ul></html>',
    },
    {
      name: 'unordered list with empty items',
      snapshot: 'enriched-text-unordered-list-empty-items.png',
      html: '<html><ul><li>Alpha</li><li></li><li>Gamma</li></ul></html>',
    },
    {
      name: 'ordered list',
      snapshot: 'enriched-text-ordered-list.png',
      html: '<html><ol><li>One</li><li>Two</li><li>Three</li></ol></html>',
    },
    {
      name: 'ordered list with empty items',
      snapshot: 'enriched-text-ordered-list-empty-items.png',
      html: '<html><ol><li>One</li><li></li><li>Three</li></ol></html>',
    },
    {
      name: 'checkbox list all unchecked',
      snapshot: 'enriched-text-checkbox-list-unchecked.png',
      html: '<html><ul data-type="checkbox"><li>one</li><li>two</li></ul></html>',
    },
    {
      name: 'checkbox list with checked item',
      snapshot: 'enriched-text-checkbox-list-checked.png',
      html: '<html><ul data-type="checkbox"><li checked>one</li><li>two</li></ul></html>',
    },
    {
      name: 'checkbox list with empty items',
      snapshot: 'enriched-text-checkbox-list-empty-items.png',
      html: '<html><ul data-type="checkbox"><li checked>one</li><li></li><li>three</li></ul></html>',
    },
    {
      name: 'blockquote and codeblock',
      snapshot: 'enriched-text-blockquote-codeblock.png',
      html: [
        '<html>',
        '<blockquote><p>Quoted line</p></blockquote>',
        '<codeblock><p>const a = 1;</p></codeblock>',
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
