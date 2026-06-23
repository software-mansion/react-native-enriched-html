import { test, expect, type Page } from '@playwright/test';

test.setTimeout(90_000);

const sel = {
  root: '[data-testid="test-enriched-text-root"]',
  htmlInput: '[data-testid="test-enriched-text-html-input"]',
  setValueButton: '[data-testid="test-enriched-text-set-value-button"]',
  valueOutput: '[data-testid="test-enriched-text-value-output"]',
  display: '[data-testid="test-enriched-text-display"]',
  displayInner: '[data-testid="test-enriched-text-display"] .et-view',
  linkPressOutput: '[data-testid="test-enriched-text-link-press-output"]',
  mentionPressOutput: '[data-testid="test-enriched-text-mention-press-output"]',
} as const;

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

function linkPress(page: Page) {
  return page.locator(sel.linkPressOutput);
}

function mentionPress(page: Page) {
  return page.locator(sel.mentionPressOutput);
}

test.describe('EnrichedText link press', () => {
  test('pressing a link emits onLinkPress with the url', async ({ page }) => {
    await gotoTestEnrichedText(page);
    await setEnrichedTextValue(
      page,
      '<html><p>Visit <a href="https://example.com">our site</a> now.</p></html>'
    );

    await expect(linkPress(page)).toHaveText('null');

    await page.locator(`${sel.displayInner} a`).click();

    await expect
      .poll(async () =>
        JSON.parse((await linkPress(page).textContent()) || 'null')
      )
      .toEqual({ url: 'https://example.com' });
  });

  test('pressing text styled inside a link still emits onLinkPress', async ({
    page,
  }) => {
    await gotoTestEnrichedText(page);
    await setEnrichedTextValue(
      page,
      '<html><p>A bold <a href="https://example.com/path">l<b>in</b>k</a> here.</p></html>'
    );

    await page.locator(`${sel.displayInner} a b`).click();

    await expect
      .poll(async () =>
        JSON.parse((await linkPress(page).textContent()) || 'null')
      )
      .toEqual({ url: 'https://example.com/path' });
  });

  test('pressing non-link text does not emit onLinkPress', async ({ page }) => {
    await gotoTestEnrichedText(page);
    await setEnrichedTextValue(
      page,
      '<html><p>Plain text with a <a href="https://example.com">link</a>.</p></html>'
    );

    await page
      .locator(`${sel.displayInner} p`)
      .click({ position: { x: 2, y: 2 } });

    await expect(linkPress(page)).toHaveText('null');
  });
});

test.describe('EnrichedText mention press', () => {
  test('pressing a mention emits onMentionPress with text and indicator', async ({
    page,
  }) => {
    await gotoTestEnrichedText(page);
    await setEnrichedTextValue(
      page,
      '<html><p>Hello <mention indicator="@" text="@John Doe">@John Doe</mention>!</p></html>'
    );

    await expect(mentionPress(page)).toHaveText('null');

    await page.locator(`${sel.displayInner} mention`).click();

    await expect
      .poll(async () =>
        JSON.parse((await mentionPress(page).textContent()) || 'null')
      )
      .toEqual({ text: '@John Doe', indicator: '@', attributes: {} });
  });

  test('pressing a mention exposes its custom attributes', async ({ page }) => {
    await gotoTestEnrichedText(page);
    await setEnrichedTextValue(
      page,
      '<html><p>Channel <mention indicator="#" text="general" id="42" custom="custom-attribute" type="channel">#general</mention> here.</p></html>'
    );

    await page.locator(`${sel.displayInner} mention`).click();

    await expect
      .poll(async () =>
        JSON.parse((await mentionPress(page).textContent()) || 'null')
      )
      .toEqual({
        text: 'general',
        indicator: '#',
        attributes: { id: '42', custom: 'custom-attribute', type: 'channel' },
      });
  });

  test('pressing text styled inside a mention still emits onMentionPress', async ({
    page,
  }) => {
    await gotoTestEnrichedText(page);
    await setEnrichedTextValue(
      page,
      '<html><p>Hi <mention indicator="@" text="@Jane">@Ja<s>ne</s></mention>.</p></html>'
    );

    await page.locator(`${sel.displayInner} mention s`).click();

    await expect
      .poll(async () =>
        JSON.parse((await mentionPress(page).textContent()) || 'null')
      )
      .toEqual({ text: '@Jane', indicator: '@', attributes: {} });
  });

  test('pressing non-mention text does not emit onMentionPress', async ({
    page,
  }) => {
    await gotoTestEnrichedText(page);
    await setEnrichedTextValue(
      page,
      '<html><p>Some text <mention indicator="@" text="@Jane">@Jane</mention>.</p></html>'
    );

    await page
      .locator(`${sel.displayInner} p`)
      .click({ position: { x: 2, y: 2 } });

    await expect(mentionPress(page)).toHaveText('null');
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
    test(`pressing a link inside a ${c.name} emits onLinkPress`, async ({
      page,
    }) => {
      await gotoTestEnrichedText(page);
      await setEnrichedTextValue(
        page,
        `<html>${c.open}<li>Visit <a href="https://example.com/list">our site</a></li><li>Other item</li>${c.close}</html>`
      );

      await expect(linkPress(page)).toHaveText('null');

      await page.locator(`${sel.displayInner} li a`).click();

      await expect
        .poll(async () =>
          JSON.parse((await linkPress(page).textContent()) || 'null')
        )
        .toEqual({ url: 'https://example.com/list' });
    });

    test(`pressing a mention inside a ${c.name} emits onMentionPress`, async ({
      page,
    }) => {
      await gotoTestEnrichedText(page);
      await setEnrichedTextValue(
        page,
        `<html>${c.open}<li>Hello <mention indicator="@" text="@John Doe" id="1">@John Doe</mention></li><li>Other item</li>${c.close}</html>`
      );

      await expect(mentionPress(page)).toHaveText('null');

      await page.locator(`${sel.displayInner} li mention`).click();

      await expect
        .poll(async () =>
          JSON.parse((await mentionPress(page).textContent()) || 'null')
        )
        .toEqual({
          text: '@John Doe',
          indicator: '@',
          attributes: { id: '1' },
        });
    });
  }
});
