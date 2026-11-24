import { test, expect, type Page } from '@playwright/test';

// 'The quick brown fox jumps over the lazy dog again and again' (0-59),
// '\n' (59), 'BBBB' (60-64)
const FIRST_PARAGRAPH_END = 59;
const SECOND_PARAGRAPH_START = 60;
const TEXT_END = 64;

interface TextRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

async function measure(
  page: Page,
  ranges: { start: number; end: number }[]
): Promise<TextRect[][]> {
  await page.getByTestId('ranges-input').fill(JSON.stringify(ranges));
  await page.getByTestId('measure-button').click();
  await expect(page.getByTestId('rects-json')).not.toHaveValue('');
  const json = await page.getByTestId('rects-json').inputValue();
  return JSON.parse(json) as TextRect[][];
}

// Clicks the middle of a measured rect and returns where the caret landed
async function caretAtCenterOf(page: Page, rect: TextRect): Promise<number> {
  const box = await page.locator('.eti-editor').boundingBox();
  if (!box) throw new Error('No editor');
  await page.mouse.click(
    box.x + rect.x + rect.width / 2,
    box.y + rect.y + rect.height / 2
  );
  await expect(page.getByTestId('selection-start')).not.toHaveText('');
  return Number(await page.getByTestId('selection-start').textContent());
}

test.describe('measureRanges', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test-measure-ranges');
    await page.waitForSelector('[data-testid="editor-container"]');
  });

  test('returns one result per range, in order', async ({ page }) => {
    const rects = await measure(page, [
      { start: 4, end: 9 },
      { start: SECOND_PARAGRAPH_START, end: TEXT_END },
      { start: 2, end: 2 },
    ]);
    expect(rects).toHaveLength(3);
    expect(rects.every((r) => r.length === 1)).toBe(true);
    expect(rects[1]![0]!.y).toBeGreaterThan(rects[0]![0]!.y);
  });

  test('a collapsed range is a zero-width caret rect', async ({ page }) => {
    const [rects] = await measure(page, [{ start: 0, end: 0 }]);
    expect(rects).toHaveLength(1);
    expect(rects![0]!.width).toBe(0);
    expect(rects![0]!.height).toBeGreaterThan(0);
    // inside the input's padding
    expect(rects![0]!.x).toBeCloseTo(12, 0);
    expect(rects![0]!.y).toBeGreaterThanOrEqual(12);
  });

  test('a word is a single rect over that word', async ({ page }) => {
    const [rects] = await measure(page, [{ start: 4, end: 9 }]);
    expect(rects).toHaveLength(1);
    expect(rects![0]!.width).toBeGreaterThan(0);

    const caret = await caretAtCenterOf(page, rects![0]!);
    expect(caret).toBeGreaterThanOrEqual(4);
    expect(caret).toBeLessThanOrEqual(9);
  });

  test('a wrapped paragraph is a rect per line', async ({ page }) => {
    const [rects] = await measure(page, [
      { start: 0, end: FIRST_PARAGRAPH_END },
    ]);
    expect(rects!.length).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < rects!.length; i++) {
      expect(rects![i]!.y).toBeGreaterThan(rects![i - 1]!.y);
    }
  });

  test('a range across paragraphs covers both', async ({ page }) => {
    const [rects] = await measure(page, [
      { start: FIRST_PARAGRAPH_END - 5, end: TEXT_END },
    ]);
    expect(rects).toHaveLength(2);

    const caret = await caretAtCenterOf(page, rects![1]!);
    expect(caret).toBeGreaterThanOrEqual(SECOND_PARAGRAPH_START);
    expect(caret).toBeLessThanOrEqual(TEXT_END);
  });
});
