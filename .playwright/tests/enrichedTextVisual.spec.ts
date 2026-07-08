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
        '<p><b>S</i>om</i>e</b> <b>mix</b><i>ed</i> <s>t<u>ex</u>t</s>.</p>',
        '<p>A <a href="https://example.com">link</a> here.</p>',
        '<p>A bold <a href="https://example.com">l<b>in<b/>k</a> here.</p>',
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
      html: '<html><h4>Empty lists</h4><ul><li></li><li>Alpha</li><li></li><li>Gamma</li><li></li></ul><p>bottom</p></html>',
    },
    {
      name: 'ordered list',
      snapshot: 'enriched-text-ordered-list.png',
      html: '<html><ol><li>One</li><li>Two</li><li>Three</li></ol></html>',
    },
    {
      name: 'ordered list with empty items',
      snapshot: 'enriched-text-ordered-list-empty-items.png',
      html: '<html><h4>Empty lists</h4><ol><li></li><li>One</li><li></li><li>Three</li><li></li></ol><p>bottom</p></html>',
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
      html: '<html><h4>Empty lists</h4><ul data-type="checkbox"><li></li><li checked>one</li><li></li><li>three</li><li checked></li></ul><p>bottom</p></html>',
    },
    {
      name: 'unordered list with wrapped text',
      snapshot: 'enriched-text-unordered-list-wrapped.png',
      html: '<html><ul><li>This is a very long unordered list item that should naturally wrap onto multiple lines to ensure that the bullet alignment behaves as expected.</li></ul></html>',
    },
    {
      name: 'ordered list with wrapped text',
      snapshot: 'enriched-text-ordered-list-wrapped.png',
      html: '<html><ol><li>This is a very long ordered list item that should naturally wrap onto multiple lines to ensure that the number alignment behaves as expected.</li></ol></html>',
    },
    {
      name: 'checkbox list with wrapped text',
      snapshot: 'enriched-text-checkbox-list-wrapped.png',
      html: '<html><ul data-type="checkbox"><li>This is a very long checkbox list item that should naturally wrap onto multiple lines to ensure that the checkbox alignment behaves as expected.</li></ul></html>',
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

test.describe('visual: complex lists and layouts', () => {
  test('all 3 types of the list at once', async ({ page }) => {
    const html = [
      '<html>',
      '<ul><li>Bullet item</li></ul>',
      '<ol><li>Numbered item</li></ol>',
      '<ul data-type="checkbox"><li checked>Checked item</li><li>Unchecked item</li></ul>',
      '</html>',
    ].join('');

    await gotoTestEnrichedText(page);
    await setEnrichedTextValue(page, html);
    await expect(displayLocator(page)).toHaveScreenshot(
      'enriched-text-all-list-types.png'
    );
  });
});

test.describe('visual: typography, blocks, and wrapping', () => {
  const cases = [
    {
      name: 'all 6 headings',
      snapshot: 'enriched-text-all-headings.png',
      html: '<html><h1>Heading 1</h1><h2>Heading 2</h2><h3>Heading 3</h3><h4>Heading 4</h4><h5>Heading 5</h5><h6>Heading 6</h6></html>',
    },
    {
      name: 'blockquote, code, codeblock',
      snapshot: 'enriched-text-blockquote-code-codeblock.png',
      html: [
        '<html>',
        '<blockquote><p>This is a blockquote. Blockquote for quoting in a block.</p></blockquote>',
        '<p>Here is some <code>inline code</code> mixed in text.</p>',
        '<codeblock><p>function test() {</p><p>  return true;</p><p>}</p></codeblock>',
        '</html>',
      ].join(''),
    },
    {
      name: 'multiple newlines and multiple spaces',
      snapshot: 'enriched-text-newlines-spaces.png',
      html: [
        '<html>',
        '<p>Word        spaced        out        a        lot.</p>',
        '<p><br></p>',
        '<p><br></p>',
        '<p>Text after empty newlines.</p>',
        '</html>',
      ].join(''),
    },
    {
      name: 'line wrapping',
      snapshot: 'enriched-text-line-wrapping.png',
      html: [
        '<html>',
        '<p>This is a standard paragraph with enough text that it should naturally wrap to the next line when it reaches the edge of the container.</p>',
        '<p>SuperLongWordWithoutAnySpacesThatShouldForceTheWordBreakOrOverflowWrapRuleToKickInAndPreventTheLayoutFromBreakingHorizontally</p>',
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

test.describe('visual: mentions', () => {
  test('display mentions', async ({ page }) => {
    await gotoTestEnrichedText(page);
    await setEnrichedTextValue(
      page,
      '<html><p>Hello <mention indicator="@" text="@John Doe">@Jo<s>hn D</s>oe</mention>!</p></html>'
    );
    await expect(displayLocator(page)).toHaveScreenshot(
      'enriched-text-mentions.png'
    );
  });
});

test.describe('visual: images', () => {
  test.beforeEach(async ({ page }) => {
    const routePattern = '**/pw-e2e-ok.png';
    const pngBody = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );
    await page.route(routePattern, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: pngBody,
      });
    });

    // Abort broken image to force placeholder
    const brokenPattern = '**/pw-e2e-broken.png';
    await page.route(brokenPattern, (route) => route.abort());
  });

  const cases = [
    {
      name: 'inline images next to some text',
      snapshot: 'enriched-text-images-inline.png',
      html: '<html><p>Start text <img src="/pw-e2e-ok.png" width="40" height="40" /> end text.</p></html>',
    },
    {
      name: 'inline images inside list',
      snapshot: 'enriched-text-images-inside-list.png',
      html: '<html><ul><li>Bullet item <img src="/pw-e2e-ok.png" width="20" height="20" /> with image.</li></ul></html>',
    },
    {
      name: 'image placeholder display next to some text',
      snapshot: 'enriched-text-images-placeholder-inline.png',
      html: '<html><p>Look at this broken <img src="/pw-e2e-broken.png" width="60" height="60" /> picture.</p></html>',
    },
    {
      name: 'image placeholder inside lists',
      snapshot: 'enriched-text-images-placeholder-list.png',
      html: '<html><ol><li>List with a broken image <img src="" width="20" height="20" /> inside.</li></ol></html>',
    },
  ];

  for (const c of cases) {
    test(c.name, async ({ page }) => {
      await gotoTestEnrichedText(page);
      await setEnrichedTextValue(page, c.html);

      await page.waitForTimeout(100);

      await expect(displayLocator(page)).toHaveScreenshot(c.snapshot);
    });
  }
});
