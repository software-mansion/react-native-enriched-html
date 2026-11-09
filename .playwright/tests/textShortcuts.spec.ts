import { test, expect, type Page } from '@playwright/test';

import {
  focusEnrichedEditable,
  getSerializedHtml,
  gotoVisualRegression,
  setEditorHtml,
  setTextShortcutsOverride,
} from '../helpers/visual-regression';
import { toolbarButton } from '../helpers/toolbar';

const DELAY_MS = 80;

async function typeText(page: Page, text: string): Promise<void> {
  const editor = await focusEnrichedEditable(page);
  await editor.pressSequentially(text, { delay: DELAY_MS });
}

test.describe('text shortcuts — paragraph (default)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoVisualRegression(page);
  });

  test('typing "- " at paragraph start creates an unordered list', async ({
    page,
  }) => {
    await setEditorHtml(page, '<html><p></p></html>');
    await typeText(page, '- ');

    await expect
      .poll(async () => {
        const html = await getSerializedHtml(page);
        return /<ul/i.test(html) && /<li/i.test(html);
      })
      .toBe(true);
  });

  test('typing "1. " at paragraph start creates an ordered list', async ({
    page,
  }) => {
    await setEditorHtml(page, '<html><p></p></html>');
    await typeText(page, '1. ');

    await expect
      .poll(async () => {
        const html = await getSerializedHtml(page);
        return /<ol/i.test(html) && /<li/i.test(html);
      })
      .toBe(true);
  });

  test('typing "- " in the middle of text does not trigger list shortcut', async ({
    page,
  }) => {
    await setEditorHtml(page, '<html><p></p></html>');
    // Type some text first so "- " is not at the paragraph start
    await typeText(page, 'hello - ');

    await expect.poll(async () => getSerializedHtml(page)).toMatch(/hello - /);

    const html = await getSerializedHtml(page);
    expect(html).not.toMatch(/<ul/i);
  });

  test('typing "- " inside an existing list does not create a new list', async ({
    page,
  }) => {
    await setEditorHtml(page, '<html><ul><li>existing item</li></ul></html>');
    const editor = await focusEnrichedEditable(page);
    await editor.press('End');
    await editor.pressSequentially('1. ', { delay: DELAY_MS });

    const html = await getSerializedHtml(page);
    expect(html).not.toMatch(/<ol/i);
  });
});

test.describe('text shortcuts — paragraph (custom)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoVisualRegression(page);
  });

  test('custom "# " shortcut converts to h1', async ({ page }) => {
    await setTextShortcutsOverride(page, '[{"trigger":"# ","style":"h1"}]');
    await setEditorHtml(page, '<html><p></p></html>');
    await typeText(page, '# ');

    await expect.poll(async () => getSerializedHtml(page)).toMatch(/<h1/i);
  });

  test('custom "> " shortcut converts to blockquote', async ({ page }) => {
    await setTextShortcutsOverride(
      page,
      '[{"trigger":"> ","style":"blockquote"}]'
    );
    await setEditorHtml(page, '<html><p></p></html>');
    await typeText(page, '> ');

    await expect
      .poll(async () => getSerializedHtml(page))
      .toMatch(/<blockquote/i);
  });

  test('custom paragraph shortcut trigger text is removed from the output', async ({
    page,
  }) => {
    await setTextShortcutsOverride(page, '[{"trigger":"# ","style":"h1"}]');
    await setEditorHtml(page, '<html><p></p></html>');
    await typeText(page, '# ');

    const html = await getSerializedHtml(page);
    expect(html).not.toMatch(/# /);
  });

  test('empty textShortcuts array disables all shortcuts', async ({ page }) => {
    await setTextShortcutsOverride(page, '[]');
    await setEditorHtml(page, '<html><p></p></html>');
    await typeText(page, '- ');

    const html = await getSerializedHtml(page);
    expect(html).not.toMatch(/<ul/i);
    expect(html).toMatch(/- /);
  });
});

test.describe('text shortcuts — inline (custom)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoVisualRegression(page);
  });

  test('single-char delimiter: "*hello*" applies italic', async ({ page }) => {
    await setTextShortcutsOverride(page, '[{"trigger":"*","style":"italic"}]');
    await setEditorHtml(page, '<html><p></p></html>');
    await typeText(page, '*hello*');

    await expect
      .poll(async () => getSerializedHtml(page))
      .toMatch(/<i>hello<\/i>/i);
  });

  test('double-char delimiter: "**hello**" applies bold', async ({ page }) => {
    await setTextShortcutsOverride(page, '[{"trigger":"**","style":"bold"}]');
    await setEditorHtml(page, '<html><p></p></html>');
    await typeText(page, '**hello**');

    await expect
      .poll(async () => getSerializedHtml(page))
      .toMatch(/<b>hello<\/b>/i);
  });

  test('backtick delimiter: "`hello`" applies inline code', async ({
    page,
  }) => {
    await setTextShortcutsOverride(
      page,
      '[{"trigger":"`","style":"inline_code"}]'
    );
    await setEditorHtml(page, '<html><p></p></html>');
    await typeText(page, '`hello`');

    await expect
      .poll(async () => getSerializedHtml(page))
      .toMatch(/<code>hello<\/code>/i);
  });

  test('inline shortcut removes both delimiters from output', async ({
    page,
  }) => {
    await setTextShortcutsOverride(page, '[{"trigger":"*","style":"italic"}]');
    await setEditorHtml(page, '<html><p></p></html>');
    await typeText(page, '*hello*');

    const html = await getSerializedHtml(page);
    expect(html).not.toMatch(/\*/);
  });

  test('longer trigger takes precedence: "**" does not trigger "*" shortcut', async ({
    page,
  }) => {
    await setTextShortcutsOverride(
      page,
      '[{"trigger":"*","style":"italic"},{"trigger":"**","style":"bold"}]'
    );
    await setEditorHtml(page, '<html><p></p></html>');
    await typeText(page, '**hello**');

    const html = await getSerializedHtml(page);
    // Should apply bold, NOT italic
    expect(html).toMatch(/<b>hello<\/b>/i);
    expect(html).not.toMatch(/<i>/i);
  });

  test('inline shortcut does not fire when there is no matching opening delimiter', async ({
    page,
  }) => {
    await setTextShortcutsOverride(page, '[{"trigger":"*","style":"italic"}]');
    await setEditorHtml(page, '<html><p></p></html>');
    await typeText(page, 'hello*');

    const html = await getSerializedHtml(page);
    expect(html).not.toMatch(/<i>/i);
    expect(html).toMatch(/hello\*/);
  });
});

test.describe('text shortcuts — mark clearing after inline shortcut', () => {
  test.beforeEach(async ({ page }) => {
    await gotoVisualRegression(page);
  });

  test('text typed immediately after bold shortcut is not bold', async ({
    page,
  }) => {
    await setTextShortcutsOverride(page, '[{"trigger":"**","style":"bold"}]');
    await setEditorHtml(page, '<html><p></p></html>');

    // Apply bold via shortcut
    await typeText(page, '**hello**');

    // Type more text right after — it should NOT be bold
    const editor = await focusEnrichedEditable(page);
    await editor.pressSequentially(' world', { delay: DELAY_MS });

    await expect(toolbarButton(page, 'bold')).not.toHaveClass(
      /toolbar-btn--active/
    );

    const html = await getSerializedHtml(page);
    // " world" must be outside the <b> tag
    expect(html).not.toMatch(/<b>hello world<\/b>/i);
    expect(html).toMatch(/<b>hello<\/b>/i);
  });

  test('text typed immediately after italic shortcut is not italic', async ({
    page,
  }) => {
    await setTextShortcutsOverride(page, '[{"trigger":"*","style":"italic"}]');
    await setEditorHtml(page, '<html><p></p></html>');

    await typeText(page, '*hello*');

    const editor = await focusEnrichedEditable(page);
    await editor.pressSequentially(' world', { delay: DELAY_MS });

    await expect(toolbarButton(page, 'italic')).not.toHaveClass(
      /toolbar-btn--active/
    );

    const html = await getSerializedHtml(page);
    expect(html).not.toMatch(/<i>hello world<\/i>/i);
    expect(html).toMatch(/<i>hello<\/i>/i);
  });
});
