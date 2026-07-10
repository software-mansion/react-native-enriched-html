import { test, expect, type Page } from '@playwright/test';

test.setTimeout(90_000);

const IMAGE_ROUTE = '**/pw-e2e-ok.png';
const IMAGE_SRC = '/pw-e2e-ok.png';
const BROKEN_IMAGE_ROUTE = '**/pw-e2e-broken.png';
const BROKEN_IMAGE_SRC = '/pw-e2e-broken.png';
const PNG_BODY = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

const sel = {
  root: '[data-testid="test-enriched-text-root"]',
  htmlInput: '[data-testid="test-enriched-text-html-input"]',
  setValueButton: '[data-testid="test-enriched-text-set-value-button"]',
  valueOutput: '[data-testid="test-enriched-text-value-output"]',
  display: '[data-testid="test-enriched-text-display"]',
  displayInner: '[data-testid="test-enriched-text-display"] .et-view',
  imagePressOutput: '[data-testid="test-enriched-text-image-press-output"]',
} as const;

const VISIBILITY_TIMEOUT_MS = 1_000;

test.beforeEach(async ({ page }) => {
  await page.route(IMAGE_ROUTE, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: PNG_BODY,
    });
  });
  await page.route(BROKEN_IMAGE_ROUTE, (route) => route.abort());
});

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

function imagePress(page: Page) {
  return page.locator(sel.imagePressOutput);
}

test.describe('EnrichedText image press', () => {
  test('pressing an image emits onImagePress with the image', async ({
    page,
  }) => {
    await gotoTestEnrichedText(page);
    await setEnrichedTextValue(
      page,
      `<html><p>Look <img src="${IMAGE_SRC}" width="32" height="32" /> now.</p></html>`
    );

    await expect(imagePress(page)).toHaveText('null');

    await page.locator(`${sel.displayInner} img`).click();

    await expect
      .poll(async () =>
        JSON.parse((await imagePress(page).textContent()) || 'null')
      )
      .toEqual({ image: { uri: IMAGE_SRC, width: 32, height: 32 } });
  });

  test('pressing an image surrounded by styled text still emits onImagePress', async ({
    page,
  }) => {
    await gotoTestEnrichedText(page);
    await setEnrichedTextValue(
      page,
      `<html><p>A <b>bold</b> <img src="${IMAGE_SRC}" width="120" height="60" /> here.</p></html>`
    );

    await page.locator(`${sel.displayInner} img`).click();

    await expect
      .poll(async () =>
        JSON.parse((await imagePress(page).textContent()) || 'null')
      )
      .toEqual({ image: { uri: IMAGE_SRC, width: 120, height: 60 } });
  });

  test('pressing non-image text does not emit onImagePress', async ({
    page,
  }) => {
    await gotoTestEnrichedText(page);
    await setEnrichedTextValue(
      page,
      `<html><p>Plain text with an <img src="${IMAGE_SRC}" width="32" height="32" />.</p></html>`
    );

    await page
      .locator(`${sel.displayInner} p`)
      .click({ position: { x: 2, y: 2 } });

    await expect(imagePress(page)).toHaveText('null');
  });

  test('pressing an empty-src placeholder does not emit onImagePress', async ({
    page,
  }) => {
    await gotoTestEnrichedText(page);
    await setEnrichedTextValue(
      page,
      '<html><p>Before <img src="" width="40" height="40" /> after.</p></html>'
    );

    await expect(page.locator(`${sel.displayInner} img`)).toBeVisible({
      timeout: VISIBILITY_TIMEOUT_MS,
    });

    await page.locator(`${sel.displayInner} img`).click();

    await expect(imagePress(page)).toHaveText('null');
  });

  test('pressing a broken-URL placeholder does emit onImagePress', async ({
    page,
  }) => {
    await gotoTestEnrichedText(page);
    await setEnrichedTextValue(
      page,
      `<html><p>Before <img src="${BROKEN_IMAGE_SRC}" width="40" height="40" /> after.</p></html>`
    );

    await expect(page.locator(`${sel.displayInner} img`)).toBeVisible({
      timeout: VISIBILITY_TIMEOUT_MS,
    });

    await page.locator(`${sel.displayInner} img`).click();

    await expect
      .poll(async () =>
        JSON.parse((await imagePress(page).textContent()) || 'null')
      )
      .toEqual({ image: { uri: BROKEN_IMAGE_SRC, width: 40, height: 40 } });
  });
});

test.describe('EnrichedText press inside lists', () => {
  const listCases = [
    {
      name: 'unordered list',
      open: '<ul>',
      close: '</ul>',
    },
    {
      name: 'ordered list',
      open: '<ol>',
      close: '</ol>',
    },
    {
      name: 'checkbox list',
      open: '<ul data-type="checkbox">',
      close: '</ul>',
    },
  ];

  for (const c of listCases) {
    test(`pressing an image inside a ${c.name} emits onImagePress`, async ({
      page,
    }) => {
      await gotoTestEnrichedText(page);
      await setEnrichedTextValue(
        page,
        `<html>${c.open}<li><p>See <img src="${IMAGE_SRC}" width="28" height="28" /> tiny</p></li><li><p>Other item</p></li>${c.close}</html>`
      );

      await expect(imagePress(page)).toHaveText('null');

      await page.locator(`${sel.displayInner} li img`).click();

      await expect
        .poll(async () =>
          JSON.parse((await imagePress(page).textContent()) || 'null')
        )
        .toEqual({ image: { uri: IMAGE_SRC, width: 28, height: 28 } });
    });
  }
});
