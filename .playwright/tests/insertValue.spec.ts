import { test, expect } from '@playwright/test';

import {
  getInsertValueHtml,
  gotoInsertValue,
  insertEditorValue,
  insertValueAt,
  insertValueEditorLocator,
  resetInsertValueScenario,
  setInsertValueEditorHtml,
  toolbarButton,
  typeInInsertValueEditor,
} from '../helpers/insertValue';

test.describe('insertValue', () => {
  test.beforeEach(async ({ page }) => {
    await gotoInsertValue(page);
  });

  test('plain text into empty editor', async ({ page }) => {
    await resetInsertValueScenario(page);
    await insertEditorValue(page, 'Hello, world!');

    await expect(insertValueEditorLocator(page)).toHaveScreenshot(
      'insert_value_plain_into_empty.png'
    );
  });

  test('plain text inherits active inline style', async ({ page }) => {
    await resetInsertValueScenario(page);
    await typeInInsertValueEditor(page, 'before');
    await toolbarButton(page, 'bold').click();
    await insertEditorValue(page, 'BOLD');

    await expect(insertValueEditorLocator(page)).toHaveScreenshot(
      'insert_value_inherits_inline_style.png'
    );
  });

  test('plain text into empty paragraph-styled line', async ({ page }) => {
    await resetInsertValueScenario(page);
    await toolbarButton(page, 'h1').click();
    await insertEditorValue(page, 'Heading');

    await expect(insertValueEditorLocator(page)).toHaveScreenshot(
      'insert_value_into_empty_paragraph_style.png'
    );
  });

  test('heading HTML into empty line', async ({ page }) => {
    await resetInsertValueScenario(page);
    await insertEditorValue(page, '<html><h2>Hello</h2></html>');

    await expect(insertValueEditorLocator(page)).toHaveScreenshot(
      'insert_value_heading_into_empty_line.png'
    );
  });

  test('heading HTML into line with existing content', async ({ page }) => {
    await resetInsertValueScenario(page);
    await typeInInsertValueEditor(page, 'before');
    await insertEditorValue(page, '<html><h3>inserted</h3></html>');

    await expect(insertValueEditorLocator(page)).toHaveScreenshot(
      'insert_value_heading_into_nonempty_line.png'
    );
  });

  test('bold HTML blocked inside code block', async ({ page }) => {
    await resetInsertValueScenario(page);
    await toolbarButton(page, 'codeBlock').click();
    await typeInInsertValueEditor(page, 'code');
    await insertEditorValue(page, '<html><b>bold</b></html>');

    const html = await getInsertValueHtml(page);
    expect(html).toMatch(/<codeblock>[\s\S]*codebold[\s\S]*<\/codeblock>/i);
    expect(html).not.toMatch(/<b>/i);

    await expect(insertValueEditorLocator(page)).toHaveScreenshot(
      'insert_value_bold_blocked_in_codeblock.png'
    );
  });

  test('multi-paragraph HTML at caret', async ({ page }) => {
    await resetInsertValueScenario(page);
    await typeInInsertValueEditor(page, 'One');
    await insertEditorValue(page, '<html><h4>heading</h4><p>normal</p></html>');

    await expect(insertValueEditorLocator(page)).toHaveScreenshot(
      'insert_value_multi_paragraph.png'
    );
  });

  test('codeblock merges into a list item without extra blank lines', async ({
    page,
  }) => {
    await gotoInsertValue(page);
    await setInsertValueEditorHtml(
      page,
      '<html><ul><li>one</li><li>asdfgh</li><li>two</li></ul></html>'
    );
    await insertValueAt(
      page,
      '<html><codeblock>World</codeblock></html>',
      4 + 3
    );

    const html = await getInsertValueHtml(page);
    expect(html).toMatch(/<codeblock>[\s\S]*asdWorldfgh[\s\S]*<\/codeblock>/i);
    expect(html).toMatch(/<ul>[\s\S]*<li>one<\/li>[\s\S]*<\/ul>/i);
    expect(html).toMatch(/<ul>[\s\S]*<li>two<\/li>[\s\S]*<\/ul>/i);

    await expect(insertValueEditorLocator(page)).toHaveScreenshot(
      'insert_value_codeblock_into_list_item.png'
    );
  });

  test('blockquote inserted into centered line inherits alignment', async ({
    page,
  }) => {
    await gotoInsertValue(page);
    await setInsertValueEditorHtml(
      page,
      '<html><p style="text-align: center">asdfgh</p></html>'
    );
    await insertValueAt(
      page,
      '<html><blockquote><p>World</p></blockquote></html>',
      3
    );

    const html = await getInsertValueHtml(page);
    expect(html).toMatch(
      /<blockquote>[\s\S]*<p style="text-align: center;">[\s\S]*asdWorldfgh[\s\S]*<\/p>[\s\S]*<\/blockquote>/i
    );

    await expect(insertValueEditorLocator(page)).toHaveScreenshot(
      'insert_value_blockquote_inherits_alignment.png'
    );
  });
});
