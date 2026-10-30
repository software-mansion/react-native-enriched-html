import { test, expect, type Page } from '@playwright/test';

const sel = {
  editor: '[data-testid="scroll-editor"]',
  offsetOutput: '[data-testid="scroll-offset-output"]',
} as const;

async function readOffset(page: Page): Promise<number> {
  return Number(await page.locator(sel.offsetOutput).textContent());
}

test.beforeEach(async ({ page }) => {
  await page.goto('/test-scroll');
  await page.locator(sel.editor).hover();
});

test('onScroll reports content offset', async ({ page }) => {
  await page.mouse.wheel(0, 300);
  await expect(page.locator(sel.offsetOutput)).not.toHaveText('0');
});

test('scrolling down increases and scrolling up decreases the offset', async ({
  page,
}) => {
  await page.mouse.wheel(0, 200);
  await expect.poll(() => readOffset(page)).toBeGreaterThan(0);
  const afterFirstScroll = await readOffset(page);

  await page.mouse.wheel(0, 200);
  await expect.poll(() => readOffset(page)).toBeGreaterThan(afterFirstScroll);
  const afterSecondScroll = await readOffset(page);

  await page.mouse.wheel(0, -200);
  await expect.poll(() => readOffset(page)).toBeLessThan(afterSecondScroll);
});
