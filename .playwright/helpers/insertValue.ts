import { expect, type Locator, type Page } from '@playwright/test';

import { toolbarButton } from './toolbar';

export const insertValueSelectors = {
  editor: '[data-testid="insert-value-editor"]',
  editorInner: '[data-testid="insert-value-editor"] .eti-editor',
  htmlOutput: '[data-testid="insert-value-html-output"]',
  setupHtmlInput: '[data-testid="setup-html-input"]',
  setupSetValueButton: '[data-testid="setup-set-value-button"]',
  selectionStart: '[data-testid="insert-value-selection-start"]',
  selectionEnd: '[data-testid="insert-value-selection-end"]',
  applySelectionButton: '[data-testid="insert-value-apply-selection-button"]',
  insertInput: '[data-testid="insert-value-input"]',
  insertSubmit: '[data-testid="insert-value-submit-button"]',
  focusButton: '[data-testid="focus-button"]',
  clearButton: '[data-testid="clear-button"]',
  selectionEndResult: '[data-testid="insert-value-current-selection-end"]',
} as const;

export function insertValueEditorLocator(page: Page): Locator {
  return page.locator(insertValueSelectors.editorInner);
}

export async function gotoInsertValue(page: Page): Promise<void> {
  await page.goto('/test-insert-value');
  await page.waitForSelector(insertValueSelectors.editorInner);
}

export async function focusInsertValueEditor(page: Page): Promise<Locator> {
  await page.click(insertValueSelectors.focusButton);
  const editor = insertValueEditorLocator(page);
  await expect(
    editor.locator('[contenteditable="true"]').first()
  ).toBeFocused();
  return editor;
}

export async function clearInsertValueEditor(page: Page): Promise<void> {
  await page.click(insertValueSelectors.clearButton);
  await expect.poll(async () => getInsertValueHtml(page)).toBe('');
}

export async function getInsertValueHtml(page: Page): Promise<string> {
  return (
    (await page.locator(insertValueSelectors.htmlOutput).textContent()) ?? ''
  );
}

export async function typeInInsertValueEditor(
  page: Page,
  text: string
): Promise<void> {
  const editor = await focusInsertValueEditor(page);
  await editor
    .locator('[contenteditable="true"]')
    .first()
    .pressSequentially(text);
  await expect
    .poll(async () =>
      page.locator(insertValueSelectors.selectionEndResult).textContent()
    )
    .toBe(String(text.length));
}

export async function setInsertValueEditorHtml(
  page: Page,
  html: string
): Promise<void> {
  await page.fill(insertValueSelectors.setupHtmlInput, html);
  await page.click(insertValueSelectors.setupSetValueButton);
  await expect.poll(async () => getInsertValueHtml(page)).toMatch(/^<html>/);
}

export async function applyInsertValueSelection(
  page: Page,
  start: number,
  end: number = start
): Promise<void> {
  await page.fill(insertValueSelectors.selectionStart, String(start));
  await page.fill(insertValueSelectors.selectionEnd, String(end));
  await page.click(insertValueSelectors.applySelectionButton);
  await expect
    .poll(async () =>
      page.locator(insertValueSelectors.selectionEndResult).textContent()
    )
    .toBe(String(end));
}

export async function insertValueAt(
  page: Page,
  value: string,
  start: number,
  end: number = start
): Promise<void> {
  await applyInsertValueSelection(page, start, end);
  await insertEditorValue(page, value);
}

export async function insertEditorValue(
  page: Page,
  value: string
): Promise<void> {
  await page.fill(insertValueSelectors.insertInput, value);
  await page.click(insertValueSelectors.insertSubmit);
  await expect.poll(async () => getInsertValueHtml(page)).not.toBe('');
}

export async function resetInsertValueScenario(page: Page): Promise<void> {
  await clearInsertValueEditor(page);
  await focusInsertValueEditor(page);
}

export { toolbarButton };
