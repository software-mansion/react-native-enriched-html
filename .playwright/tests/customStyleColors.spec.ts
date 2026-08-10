import { test, expect, type Page } from '@playwright/test';

import {
  editorLocator,
  getSerializedHtml,
  gotoVisualRegression,
  setEditorHtml,
} from '../helpers/visual-regression';
import { toolbarButton } from '../helpers/toolbar';

function textColorButton(page: Page) {
  return page.locator('[data-testid="toolbar-text-color"]');
}

function bgColorButton(page: Page) {
  return page.locator('[data-testid="toolbar-bg-color"]');
}

function colorSwatch(page: Page, color: string) {
  return page.locator(
    `[data-testid="toolbar-color-swatch-${color.replace('#', '')}"]`
  );
}

function colorSwatchClear(page: Page) {
  return page.locator('[data-testid="toolbar-color-swatch-clear"]');
}

async function applyTextColor(page: Page, color: string) {
  await textColorButton(page).click();
  await colorSwatch(page, color).click();
}

async function clearTextColor(page: Page) {
  await textColorButton(page).click();
  await colorSwatchClear(page).click();
}

async function applyBgColor(page: Page, color: string) {
  await bgColorButton(page).click();
  await colorSwatch(page, color).click();
}

async function clearBgColor(page: Page) {
  await bgColorButton(page).click();
  await colorSwatchClear(page).click();
}

const ROUND_TRIP_CASES: { name: string; input: string; expected: string }[] = [
  {
    name: 'foreground color only',
    input: '<html><p><span style="color: #FF0000">Red text</span></p></html>',
    expected:
      '<html><p><span style="color: #FF0000;">Red text</span></p></html>',
  },
  {
    name: 'background color only',
    input:
      '<html><p><span style="background-color: #FFFF00">Yellow bg</span></p></html>',
    expected:
      '<html><p><span style="background-color: #FFFF00;">Yellow bg</span></p></html>',
  },
  {
    name: 'foreground and background color',
    input:
      '<html><p><span style="color: #FF0000; background-color: #FFFF00">Both</span></p></html>',
    expected:
      '<html><p><span style="color: #FF0000; background-color: #FFFF00;">Both</span></p></html>',
  },
  {
    name: '8-digit hex background (transparent)',
    input:
      '<html><p><span style="background-color: #00FF0040">25% green bg</span></p></html>',
    expected:
      '<html><p><span style="background-color: #00FF0040;">25% green bg</span></p></html>',
  },
  {
    name: '8-digit hex foreground (transparent)',
    input:
      '<html><p><span style="color: #0000FF80">50% blue text</span></p></html>',
    expected:
      '<html><p><span style="color: #0000FF80;">50% blue text</span></p></html>',
  },
  {
    name: 'color inside heading',
    input:
      '<html><h6><span style="color: #000000; background-color: #00FF00">Black on green</span></h6></html>',
    expected:
      '<html><h6><span style="color: #000000; background-color: #00FF00;">Black on green</span></h6></html>',
  },
  {
    name: 'color wraps bold mark',
    input:
      '<html><p><span style="color: #FF0000"><b>Bold red</b></span></p></html>',
    expected:
      '<html><p><span style="color: #FF0000;"><b>Bold red</b></span></p></html>',
  },
  {
    name: 'multiple colored spans in one paragraph',
    input:
      '<html><p><span style="color: #FF0000">Red</span> plain <span style="color: #0000FF">Blue</span></p></html>',
    expected:
      '<html><p><span style="color: #FF0000;">Red</span> plain <span style="color: #0000FF;">Blue</span></p></html>',
  },
];

test.describe('custom style colors - HTML serialization', () => {
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

test('custom style colors visual regression', async ({ page }) => {
  await gotoVisualRegression(page);

  const html = [
    '<html>',
    '<p><span style="color: #FF5733">Standard 6-digit hex text</span></p>',
    '<p><span style="color: #FFFFFF; background-color: #000000">White text on black background</span></p>',
    '<p><span style="background-color: #00FF0040">25% transparent green background</span></p>',
    '<p><span style="color: #0000FF80">50% transparent blue text</span></p>',
    '<p><span style="color: #F00">Red 3-digit shorthand text</span></p>',
    '<h6><span style="color: #000000; background-color: #00FF00">Black text on green</span></h6>',
    '</html>',
  ].join('');

  await setEditorHtml(page, html);

  const editor = editorLocator(page);
  await expect(editor).toHaveScreenshot('custom-style-colors-visual.png');
});

test.describe('custom style colors - toolbar interaction', () => {
  test.beforeEach(async ({ page }) => {
    await gotoVisualRegression(page);
  });

  test('apply foreground color then type text', async ({ page }) => {
    const editor = editorLocator(page);
    await editor.click();

    await applyTextColor(page, '#FF0000');
    await editor.pressSequentially('Red text', { delay: 80 });

    await expect
      .poll(async () => getSerializedHtml(page))
      .toBe(
        '<html><p><span style="color: #FF0000;">Red text</span></p></html>'
      );
  });

  test('clear foreground color stops coloring new text', async ({ page }) => {
    const editor = editorLocator(page);
    await editor.click();

    await applyTextColor(page, '#FF0000');
    await editor.pressSequentially('Red', { delay: 80 });
    await clearTextColor(page);
    await editor.pressSequentially(' plain', { delay: 80 });

    await expect
      .poll(async () => getSerializedHtml(page))
      .toBe(
        '<html><p><span style="color: #FF0000;">Red</span> plain</p></html>'
      );
  });

  test('apply background color then type text', async ({ page }) => {
    const editor = editorLocator(page);
    await editor.click();

    await applyBgColor(page, '#FFFF00');
    await editor.pressSequentially('Yellow back', { delay: 80 });

    await expect
      .poll(async () => getSerializedHtml(page))
      .toBe(
        '<html><p><span style="background-color: #FFFF00;">Yellow back</span></p></html>'
      );
  });

  test('clear background color stops coloring new text', async ({ page }) => {
    const editor = editorLocator(page);
    await editor.click();

    await applyBgColor(page, '#FFFF00');
    await editor.pressSequentially('Yellow', { delay: 80 });
    await clearBgColor(page);
    await editor.pressSequentially(' plain', { delay: 80 });

    await expect
      .poll(async () => getSerializedHtml(page))
      .toBe(
        '<html><p><span style="background-color: #FFFF00;">Yellow</span> plain</p></html>'
      );
  });

  test('apply foreground and background color together', async ({ page }) => {
    const editor = editorLocator(page);
    await editor.click();

    await applyTextColor(page, '#FF0000');
    await applyBgColor(page, '#FFFF00');
    await editor.pressSequentially('Red+Yellow', { delay: 80 });

    await expect
      .poll(async () => getSerializedHtml(page))
      .toBe(
        '<html><p><span style="color: #FF0000; background-color: #FFFF00;">Red+Yellow</span></p></html>'
      );
  });

  test('foreground color with bold', async ({ page }) => {
    const editor = editorLocator(page);
    const boldBtn = toolbarButton(page, 'bold');
    await editor.click();

    await boldBtn.click();
    await applyTextColor(page, '#FF0000');
    await editor.pressSequentially('Bold red', { delay: 80 });

    await expect
      .poll(async () => getSerializedHtml(page))
      .toBe(
        '<html><p><span style="color: #FF0000;"><b>Bold red</b></span></p></html>'
      );
  });

  test('background color with italic', async ({ page }) => {
    const editor = editorLocator(page);
    const italicBtn = toolbarButton(page, 'italic');
    await editor.click();

    await italicBtn.click();
    await applyBgColor(page, '#FFFF00');
    await editor.pressSequentially('Italic yellow back', { delay: 80 });

    await expect
      .poll(async () => getSerializedHtml(page))
      .toBe(
        '<html><p><span style="background-color: #FFFF00;"><i>Italic yellow back</i></span></p></html>'
      );
  });

  test('toolbar text-color button shows active swatch when color is set', async ({
    page,
  }) => {
    const editor = editorLocator(page);
    await editor.click();

    await applyTextColor(page, '#FF0000');

    // Re-open the picker – the chosen swatch should be marked as active
    await textColorButton(page).click();
    await expect(colorSwatch(page, '#FF0000')).toHaveClass(
      /toolbar-color-swatch--active/
    );

    // Close the picker
    await textColorButton(page).click();
  });

  test('toolbar bg-color button shows active swatch when color is set', async ({
    page,
  }) => {
    const editor = editorLocator(page);
    await editor.click();

    await applyBgColor(page, '#FFFF00');

    // Re-open the picker – the chosen swatch should be marked as active
    await bgColorButton(page).click();
    await expect(colorSwatch(page, '#FFFF00')).toHaveClass(
      /toolbar-color-swatch--active/
    );

    // Close the picker
    await bgColorButton(page).click();
  });
});
