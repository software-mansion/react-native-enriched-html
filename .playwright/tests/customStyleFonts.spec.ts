import { test, expect, type Page } from '@playwright/test';

import {
  editorLocator,
  focusEnrichedEditable,
  getSerializedHtml,
  gotoVisualRegression,
  setEditorHtml,
} from '../helpers/visual-regression';
import { toolbarButton } from '../helpers/toolbar';

function fontSizeButton(page: Page) {
  return page.locator('[data-testid="toolbar-font-size"]');
}

function fontFamilyButton(page: Page) {
  return page.locator('[data-testid="toolbar-font-family"]');
}

function fontSizeOption(page: Page, size: number) {
  return page.locator(`[data-testid="font-size-${size}"]`);
}

function fontFamilyOption(page: Page, value: string) {
  return page.locator(`[data-testid="font-family-${value}"]`);
}

function fontSizeClear(page: Page) {
  return page.locator('[data-testid="font-size-clear"]');
}

function fontFamilyClear(page: Page) {
  return page.locator('[data-testid="font-family-clear"]');
}

async function applyFontSize(page: Page, size: number) {
  await fontSizeButton(page).click();
  await fontSizeOption(page, size).click();
}

async function clearFontSize(page: Page) {
  await fontSizeButton(page).click();
  await fontSizeClear(page).click();
}

async function applyFontFamily(page: Page, value: string) {
  await fontFamilyButton(page).click();
  await fontFamilyOption(page, value).click();
}

async function clearFontFamily(page: Page) {
  await fontFamilyButton(page).click();
  await fontFamilyClear(page).click();
}

const ROUND_TRIP_CASES: { name: string; input: string; expected: string }[] = [
  {
    name: 'font size only',
    input:
      '<html><p><span style="font-size: 20px">Sized text</span></p></html>',
    expected:
      '<html><p><span style="font-size: 20px;">Sized text</span></p></html>',
  },
  {
    name: 'font family only',
    input:
      '<html><p><span style="font-family: Courier">Courier text</span></p></html>',
    expected:
      '<html><p><span style="font-family: Courier;">Courier text</span></p></html>',
  },
  {
    name: 'font family with a comma-separated fallback is reduced to first family',
    input:
      '<html><p><span style="font-family: Courier, monospace">Courier text</span></p></html>',
    expected:
      '<html><p><span style="font-family: Courier;">Courier text</span></p></html>',
  },
  {
    name: 'font size and font family together',
    input:
      '<html><p><span style="font-size: 24px; font-family: Courier">Both</span></p></html>',
    expected:
      '<html><p><span style="font-size: 24px; font-family: Courier;">Both</span></p></html>',
  },
  {
    name: 'font size and color together',
    input:
      '<html><p><span style="color: #FF0000; font-size: 20px">Red big</span></p></html>',
    expected:
      '<html><p><span style="color: #FF0000; font-size: 20px;">Red big</span></p></html>',
  },
  {
    name: 'font size inside heading',
    input:
      '<html><h6><span style="font-size: 28px">Big heading</span></h6></html>',
    expected:
      '<html><h6><span style="font-size: 28px;">Big heading</span></h6></html>',
  },
  {
    name: 'font size wraps bold mark',
    input:
      '<html><p><span style="font-size: 32px"><b>Bold big</b></span></p></html>',
    expected:
      '<html><p><span style="font-size: 32px;"><b>Bold big</b></span></p></html>',
  },
  {
    name: 'multiple sized spans in one paragraph',
    input:
      '<html><p><span style="font-size: 16px">Small</span> plain <span style="font-size: 32px">Big</span></p></html>',
    expected:
      '<html><p><span style="font-size: 16px;">Small</span> plain <span style="font-size: 32px;">Big</span></p></html>',
  },
];

test.describe('custom style fonts - HTML serialization', () => {
  test.beforeEach(async ({ page }) => {
    await gotoVisualRegression(page);
  });

  for (const { name, input, expected } of ROUND_TRIP_CASES) {
    test(name, async ({ page }) => {
      await setEditorHtml(page, input);
      await expect.poll(async () => getSerializedHtml(page)).toBe(expected);
    });
  }
});

test('custom style fonts visual regression', async ({ page }) => {
  await gotoVisualRegression(page);

  const html = [
    '<html>',
    '<p>Regular family</p>',
    '<p><span style="font-size: 24px;">24px plain</span></p>',
    '<p><span style="font-family: Arial;">Sans family</span></p>',
    '<p><span style="font-size: 32px; font-family: Courier;">32 Courier</span></p>',
    '<p><b><span style="font-size: 20px;">Bold 20px</span></b> ',
    '<i><span style="font-family: Georgia;">Italic family</span></i> ',
    '<code><span style="font-family: Courier New;">Code mono</span></code></p>',
    '<h5><span style="font-size: 40px;">H5 40px</span></h5>',
    '<blockquote><p><span style="font-family: Courier New;">Quote mono family</span></p></blockquote>',
    '</html>',
  ].join('');

  await setEditorHtml(page, html);

  const editor = editorLocator(page);
  await expect(editor).toHaveScreenshot('custom-style-fonts-visual.png');
});

test.describe('custom style fonts - toolbar interaction', () => {
  test.beforeEach(async ({ page }) => {
    await gotoVisualRegression(page);
  });

  test('apply font size then type text', async ({ page }) => {
    const editor = editorLocator(page);
    await editor.click();

    await applyFontSize(page, 20);
    await editor.pressSequentially('Sized text', { delay: 80 });

    await expect
      .poll(async () => getSerializedHtml(page))
      .toBe(
        '<html><p><span style="font-size: 20px;">Sized text</span></p></html>'
      );
  });

  test('clear font size stops sizing new text', async ({ page }) => {
    const editor = editorLocator(page);
    await editor.click();

    await applyFontSize(page, 20);
    await editor.pressSequentially('Sized', { delay: 80 });
    await clearFontSize(page);
    await editor.pressSequentially(' plain', { delay: 80 });

    await expect
      .poll(async () => getSerializedHtml(page))
      .toBe(
        '<html><p><span style="font-size: 20px;">Sized</span> plain</p></html>'
      );
  });

  test('apply font family then type text', async ({ page }) => {
    const editor = editorLocator(page);
    await editor.click();

    await applyFontFamily(page, 'Georgia');
    await editor.pressSequentially('Serif text', { delay: 80 });

    await expect
      .poll(async () => getSerializedHtml(page))
      .toBe(
        '<html><p><span style="font-family: Georgia;">Serif text</span></p></html>'
      );
  });

  test('clear font family stops styling new text', async ({ page }) => {
    const editor = editorLocator(page);
    await editor.click();

    await applyFontFamily(page, 'Georgia');
    await editor.pressSequentially('Serif', { delay: 80 });
    await clearFontFamily(page);
    await editor.pressSequentially(' plain', { delay: 80 });

    await expect
      .poll(async () => getSerializedHtml(page))
      .toBe(
        '<html><p><span style="font-family: Georgia;">Serif</span> plain</p></html>'
      );
  });

  test('apply font size and font family together', async ({ page }) => {
    const editor = editorLocator(page);
    await editor.click();

    await applyFontSize(page, 24);
    await applyFontFamily(page, 'Georgia');
    await editor.pressSequentially('Big serif', { delay: 80 });

    await expect
      .poll(async () => getSerializedHtml(page))
      .toBe(
        '<html><p><span style="font-size: 24px; font-family: Georgia;">Big serif</span></p></html>'
      );
  });

  test('font size with bold', async ({ page }) => {
    const editor = editorLocator(page);
    const boldBtn = toolbarButton(page, 'bold');
    await editor.click();

    await boldBtn.click();
    await applyFontSize(page, 32);
    await editor.pressSequentially('Bold big', { delay: 80 });

    await expect
      .poll(async () => getSerializedHtml(page))
      .toBe(
        '<html><p><span style="font-size: 32px;"><b>Bold big</b></span></p></html>'
      );
  });

  test('font family with italic', async ({ page }) => {
    const editor = editorLocator(page);
    const italicBtn = toolbarButton(page, 'italic');
    await editor.click();

    await italicBtn.click();
    await applyFontFamily(page, 'Georgia');
    await editor.pressSequentially('Italic serif', { delay: 80 });

    await expect
      .poll(async () => getSerializedHtml(page))
      .toBe(
        '<html><p><span style="font-family: Georgia;"><i>Italic serif</i></span></p></html>'
      );
  });

  test('changing font size on a selection preserves per-run font family', async ({
    page,
  }) => {
    // Two runs with different families, then re-size the whole line and ensure
    // each run keeps its own family (per-range merge, not a flattened span).
    await setEditorHtml(
      page,
      [
        '<html><p>',
        '<span style="font-family: Arial">One</span>',
        '<span style="font-family: Georgia">Two</span>',
        '</p></html>',
      ].join('')
    );

    await focusEnrichedEditable(page);
    await page.keyboard.press('ControlOrMeta+a');
    await applyFontSize(page, 20);

    await expect
      .poll(async () => getSerializedHtml(page))
      .toBe(
        [
          '<html><p>',
          '<span style="font-size: 20px; font-family: Arial;">One</span>',
          '<span style="font-size: 20px; font-family: Georgia;">Two</span>',
          '</p></html>',
        ].join('')
      );
  });

  test('toolbar font-size button shows active size when set', async ({
    page,
  }) => {
    const editor = editorLocator(page);
    await editor.click();

    await applyFontSize(page, 20);

    await expect(fontSizeButton(page)).toContainText('20');
    await expect(fontSizeButton(page)).toHaveClass(/toolbar-btn--active/);

    // Re-open the picker – the chosen size should be marked as active
    await fontSizeButton(page).click();
    await expect(fontSizeOption(page, 20)).toHaveClass(
      /toolbar-font-option--active/
    );
  });

  test('toolbar font-family button shows active family when set', async ({
    page,
  }) => {
    const editor = editorLocator(page);
    await editor.click();

    await applyFontFamily(page, 'Georgia');

    // The button shows the family's label ("Serif" maps to "Georgia").
    await expect(fontFamilyButton(page)).toContainText('Serif');
    await expect(fontFamilyButton(page)).toHaveClass(/toolbar-btn--active/);

    // Re-open the picker – the chosen family should be marked as active
    await fontFamilyButton(page).click();
    await expect(fontFamilyOption(page, 'Georgia')).toHaveClass(
      /toolbar-font-option--active/
    );
  });
});
