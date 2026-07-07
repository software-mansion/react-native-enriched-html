import { test, expect, type Page } from '@playwright/test';

import { toolbarButton } from '../helpers/toolbar';
import {
  editorLocator,
  getSerializedHtml,
  gotoVisualRegression,
  setEditorHtml,
} from '../helpers/visual-regression';

// Toolbar shorthand for alignment buttons (testId: toolbar-button-alignment-{value})
function alignBtn(
  page: Page,
  alignment: 'left' | 'center' | 'right' | 'justify'
) {
  return toolbarButton(page, `alignment-${alignment}`);
}

test.describe('alignment html round-trip', () => {
  test.beforeEach(async ({ page }) => {
    await gotoVisualRegression(page);
  });

  test('center-aligned paragraph is preserved', async ({ page }) => {
    await setEditorHtml(
      page,
      '<html><p style="text-align: center">Center</p></html>'
    );
    const html = await getSerializedHtml(page);
    expect(html).toContain('<p style="text-align: center;">Center</p>');
  });

  test('right-aligned heading is preserved', async ({ page }) => {
    await setEditorHtml(
      page,
      '<html><h2 style="text-align: right">Right Heading</h2></html>'
    );
    const html = await getSerializedHtml(page);
    expect(html).toContain('<h2 style="text-align: right;">Right Heading</h2>');
  });

  test('ordered list alignment is on the <ol> wrapper, not on <li>', async ({
    page,
  }) => {
    await setEditorHtml(
      page,
      '<html><ol style="text-align: center"><li>Item 1</li><li>Item 2</li></ol></html>'
    );
    const html = await getSerializedHtml(page);
    expect(html).toContain('<ol style="text-align: center;">');
    expect(html).not.toMatch(/<li[^>]*style[^>]*>/);
  });

  test('unordered list alignment is on the <ul> wrapper', async ({ page }) => {
    await setEditorHtml(
      page,
      '<html><ul style="text-align: right"><li>Bullet</li></ul></html>'
    );
    const html = await getSerializedHtml(page);
    expect(html).toContain('<ul style="text-align: right;">');
    expect(html).not.toMatch(/<li[^>]*style[^>]*>/);
  });

  test('aligned paragraph inside blockquote is preserved', async ({ page }) => {
    await setEditorHtml(
      page,
      '<html><blockquote><p style="text-align: center">Quote</p></blockquote></html>'
    );
    const html = await getSerializedHtml(page);
    expect(html).toContain('<p style="text-align: center;">Quote</p>');
    expect(html).toContain('<blockquote>');
  });

  test('multiple paragraphs with different alignments are each preserved', async ({
    page,
  }) => {
    await setEditorHtml(
      page,
      '<html>' +
        '<p>Default</p>' +
        '<p style="text-align: center">Center</p>' +
        '<p style="text-align: right">Right</p>' +
        '</html>'
    );
    const html = await getSerializedHtml(page);
    expect(html).toContain('<p>Default</p>');
    expect(html).toContain('<p style="text-align: center;">Center</p>');
    expect(html).toContain('<p style="text-align: right;">Right</p>');
  });

  test('blockquote paragraphs can have independent alignments', async ({
    page,
  }) => {
    await setEditorHtml(
      page,
      '<html>' +
        '<blockquote>' +
        '<p style="text-align: center">Quote center</p>' +
        '<p style="text-align: left">Quote left</p>' +
        '</blockquote>' +
        '</html>'
    );
    const html = await getSerializedHtml(page);
    expect(html).toContain('<p style="text-align: center;">Quote center</p>');
    expect(html).toContain('<p style="text-align: left;">Quote left</p>');
  });
});

test.describe('alignment toolbar interaction', () => {
  test.beforeEach(async ({ page }) => {
    await gotoVisualRegression(page);
  });

  test('clicking center sets center alignment on paragraph', async ({
    page,
  }) => {
    await setEditorHtml(page, '<html><p>Hello</p></html>');
    await page.locator('.eti-editor p').click();
    await alignBtn(page, 'center').click();
    const html = await getSerializedHtml(page);
    expect(html).toContain('<p style="text-align: center;">Hello</p>');
  });

  test('clicking right sets right alignment on paragraph', async ({ page }) => {
    await setEditorHtml(page, '<html><p>Hello</p></html>');
    await page.locator('.eti-editor p').click();
    await alignBtn(page, 'right').click();
    const html = await getSerializedHtml(page);
    expect(html).toContain('<p style="text-align: right;">Hello</p>');
  });

  test('clicking justify sets justify alignment on paragraph', async ({
    page,
  }) => {
    await setEditorHtml(page, '<html><p>Hello</p></html>');
    await page.locator('.eti-editor p').click();
    await alignBtn(page, 'justify').click();
    const html = await getSerializedHtml(page);
    expect(html).toContain('<p style="text-align: justify;">Hello</p>');
  });

  test('clicking center on ordered list sets alignment on <ol> wrapper', async ({
    page,
  }) => {
    await setEditorHtml(page, '<html><ol><li>Item</li></ol></html>');
    await page.locator('.eti-editor ol li p').click();
    await alignBtn(page, 'center').click();
    const html = await getSerializedHtml(page);
    expect(html).toContain('<ol style="text-align: center;">');
    expect(html).not.toMatch(/<li[^>]*style[^>]*>/);
  });

  test('clicking center on unordered list sets alignment on <ul> wrapper', async ({
    page,
  }) => {
    await setEditorHtml(page, '<html><ul><li>Bullet</li></ul></html>');
    await page.locator('.eti-editor ul li p').click();
    await alignBtn(page, 'center').click();
    const html = await getSerializedHtml(page);
    expect(html).toContain('<ul style="text-align: center;">');
    expect(html).not.toMatch(/<li[^>]*style[^>]*>/);
  });

  test('clicking a different alignment replaces the previous one', async ({
    page,
  }) => {
    await setEditorHtml(
      page,
      '<html><p style="text-align: center">Text</p></html>'
    );
    await page.locator('.eti-editor p').click();
    await alignBtn(page, 'right').click();
    const html = await getSerializedHtml(page);
    expect(html).not.toContain('text-align: center');
    expect(html).toContain('<p style="text-align: right;">Text</p>');
  });

  test('alignment toolbar button is active when cursor is on aligned paragraph', async ({
    page,
  }) => {
    await setEditorHtml(
      page,
      '<html><p style="text-align: center">Center</p></html>'
    );
    await page.locator('.eti-editor p').click();
    await expect(alignBtn(page, 'center')).toHaveClass(/toolbar-btn--active/);
    await expect(alignBtn(page, 'left')).not.toHaveClass(/toolbar-btn--active/);
    await expect(alignBtn(page, 'right')).not.toHaveClass(
      /toolbar-btn--active/
    );
  });

  test('alignment toolbar button is active when cursor is inside aligned list', async ({
    page,
  }) => {
    await setEditorHtml(
      page,
      '<html><ol style="text-align: right"><li>Item</li></ol></html>'
    );
    await page.locator('.eti-editor ol li p').click();
    await expect(alignBtn(page, 'right')).toHaveClass(/toolbar-btn--active/);
    await expect(alignBtn(page, 'center')).not.toHaveClass(
      /toolbar-btn--active/
    );
  });
});

test.describe('alignment preserved through block style toggle', () => {
  test.beforeEach(async ({ page }) => {
    await gotoVisualRegression(page);
  });

  test('center alignment preserved when toggling paragraph to H1', async ({
    page,
  }) => {
    await setEditorHtml(
      page,
      '<html><p style="text-align: center">Hello</p></html>'
    );
    await page.locator('.eti-editor p').click();
    await toolbarButton(page, 'h1').click();
    const html = await getSerializedHtml(page);
    expect(html).toContain('<h1 style="text-align: center;">Hello</h1>');
  });

  test('right alignment preserved when toggling paragraph to H3', async ({
    page,
  }) => {
    await setEditorHtml(
      page,
      '<html><p style="text-align: right">Hello</p></html>'
    );
    await page.locator('.eti-editor p').click();
    await toolbarButton(page, 'h3').click();
    const html = await getSerializedHtml(page);
    expect(html).toContain('<h3 style="text-align: right;">Hello</h3>');
  });

  test('center alignment preserved when toggling paragraph to ordered list', async ({
    page,
  }) => {
    await setEditorHtml(
      page,
      '<html><p style="text-align: center">Hello</p></html>'
    );
    await page.locator('.eti-editor p').click();
    await toolbarButton(page, 'orderedList').click();
    const html = await getSerializedHtml(page);
    expect(html).toContain('<ol style="text-align: center;">');
    expect(html).toContain('Hello');
  });

  test('center alignment preserved when toggling paragraph to unordered list', async ({
    page,
  }) => {
    await setEditorHtml(
      page,
      '<html><p style="text-align: center">Hello</p></html>'
    );
    await page.locator('.eti-editor p').click();
    await toolbarButton(page, 'unorderedList').click();
    const html = await getSerializedHtml(page);
    expect(html).toContain('<ul style="text-align: center;">');
    expect(html).toContain('Hello');
  });

  test('center alignment preserved when toggling ordered list to paragraph', async ({
    page,
  }) => {
    await setEditorHtml(
      page,
      '<html><ol style="text-align: center"><li>Hello</li></ol></html>'
    );
    await page.locator('.eti-editor ol li p').click();
    await toolbarButton(page, 'orderedList').click();
    const html = await getSerializedHtml(page);
    expect(html).toContain('<p style="text-align: center;">Hello</p>');
  });

  test('right alignment preserved when toggling unordered list to paragraph', async ({
    page,
  }) => {
    await setEditorHtml(
      page,
      '<html><ul style="text-align: right"><li>Hello</li></ul></html>'
    );
    await page.locator('.eti-editor ul li p').click();
    await toolbarButton(page, 'unorderedList').click();
    const html = await getSerializedHtml(page);
    expect(html).toContain('<p style="text-align: right;">Hello</p>');
  });

  test('right alignment preserved when toggling paragraph to blockquote', async ({
    page,
  }) => {
    await setEditorHtml(
      page,
      '<html><p style="text-align: right">Hello</p></html>'
    );
    await page.locator('.eti-editor p').click();
    await toolbarButton(page, 'blockQuote').click();
    const html = await getSerializedHtml(page);
    expect(html).toContain('<blockquote>');
    expect(html).toContain('<p style="text-align: right;">Hello</p>');
  });

  test('center alignment preserved when toggling H1 to ordered list', async ({
    page,
  }) => {
    await setEditorHtml(
      page,
      '<html><h1 style="text-align: center">Hello</h1></html>'
    );
    await page.locator('.eti-editor h1').click();
    await toolbarButton(page, 'orderedList').click();
    const html = await getSerializedHtml(page);
    expect(html).toContain('<ol style="text-align: center;">');
    expect(html).toContain('Hello');
  });
});

test.describe('alignment visual', () => {
  test.beforeEach(async ({ page }) => {
    await gotoVisualRegression(page);
  });

  test('mixed paragraph, heading, and list alignments render correctly', async ({
    page,
  }) => {
    await setEditorHtml(
      page,
      '<html>' +
        '<p>Left aligned</p>' +
        '<p style="text-align: center">Centre aligned</p>' +
        '<h6 style="text-align: center">Heading 6 Centre</h6>' +
        '<p style="text-align: right">Right aligned</p>' +
        '<ol style="text-align: right"><li>Element 1</li><li>Element 2</li></ol>' +
        '</html>'
    );
    await expect(editorLocator(page)).toHaveScreenshot('alignment-mixed.png');
  });
});
