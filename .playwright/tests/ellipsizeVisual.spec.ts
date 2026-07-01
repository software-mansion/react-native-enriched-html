import { test, expect, type Locator, type Page } from '@playwright/test';

test.setTimeout(90_000);

type EllipsizeMode = 'head' | 'middle' | 'tail' | 'clip';

const LOREM_IPSUM = `<html><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur porta placerat nulla vitae tincidunt. In tellus neque, volutpat id molestie ut, dapibus sit amet justo. Sed nec lobortis orci. Vestibulum magna est, placerat vitae libero ut, viverra mollis purus. Curabitur lacinia a libero non congue. Vestibulum et velit lacinia, feugiat odio eget, faucibus sapien. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus eu erat commodo, condimentum augue eu, fringilla purus. Morbi at nisi eget felis dignissim fringilla. Pellentesque blandit porttitor libero. Donec accumsan, leo eget ultricies rutrum, lorem purus aliquet quam, sit amet pellentesque lectus nulla non nulla.</p></html>`;

const sel = {
  root: '[data-testid="test-ellipsize-root"]',
  display: '[data-testid="test-ellipsize-display"]',
  displayInner: '[data-testid="test-ellipsize-display"] .et-view',
  htmlInput: '[data-testid="test-ellipsize-html-input"]',
  setValueButton: '[data-testid="test-ellipsize-set-value-button"]',
  numberOfLinesInput: '[data-testid="test-ellipsize-number-of-lines-input"]',
  numberOfLinesOutput: '[data-testid="test-ellipsize-number-of-lines-output"]',
  modeButton: (mode: EllipsizeMode) =>
    `[data-testid="test-ellipsize-mode-${mode}"]`,
  modeOutput: '[data-testid="test-ellipsize-mode-output"]',
  valueOutput: '[data-testid="test-ellipsize-value-output"]',
} as const;

function displayLocator(page: Page): Locator {
  return page.locator(sel.display);
}

async function gotoTestEllipsize(page: Page): Promise<void> {
  await page.goto('/test-ellipsize');
  await page.waitForSelector(sel.displayInner);
}

async function setValue(page: Page, html: string): Promise<void> {
  await page.fill(sel.htmlInput, html);
  await page.click(sel.setValueButton);
  await expect
    .poll(async () => (await page.locator(sel.valueOutput).textContent()) ?? '')
    .toBe(html);
}

async function setNumberOfLines(page: Page, lines: number): Promise<void> {
  await page.fill(sel.numberOfLinesInput, String(lines));
  await expect
    .poll(
      async () =>
        (await page.locator(sel.numberOfLinesOutput).textContent())?.trim() ??
        ''
    )
    .toBe(String(lines));
}

async function setMode(page: Page, mode: EllipsizeMode): Promise<void> {
  await page.click(sel.modeButton(mode));
  await expect
    .poll(
      async () =>
        (await page.locator(sel.modeOutput).textContent())?.trim() ?? ''
    )
    .toBe(mode);
}

// 'middle' is excluded - it is not implemented on web
const MODES: EllipsizeMode[] = ['head', 'tail', 'clip'];

type EllipsizeCase = {
  name: string;
  slug: string;
  html: string;
  numberOfLines: number;
};

const SHARED_CASES: EllipsizeCase[] = [
  {
    name: 'paragraph that fits',
    slug: 'paragraph-fit',
    html: `<html<p>hello that is a paragraph that should fit an require no ellipsis</p></html>`,
    numberOfLines: 2,
  },
  {
    name: 'single word wrapping to multiple lines',
    slug: 'single-word',
    html:
      `<html<p>Verylongpieceoftextfitintoonelinesowecancheckthiscasewherethereis` +
      `averylongpieceoftextanditwrapsaroundsomenumberoflinesandthatwillbetruncated` +
      `accordinglytothesetellipsizemodeintheenrichedtextcomponent</p></html>`,
    numberOfLines: 2,
  },
  {
    name: 'a long word that causes line wrapping',
    slug: 'one-word-wrapping',
    html:
      `<html<p>Some paragraph with a long word that will not fit and wrap.` +
      ` The long word: Konstantynopolitanczykowianeczka</p></html>`,
    numberOfLines: 2,
  },
  {
    name: 'paragraph with a number of lines much greater than the given limit',
    slug: 'very-long-paragraph',
    html: LOREM_IPSUM,
    numberOfLines: 2,
  },
  {
    name: 'a number of paragraphs much greater than the given limit',
    slug: 'multiple-short-paragraphs',
    html: `<html<p>first</p><p>second</p><p>third</p><p>fourth</p><p>fifth</p><p>sixth</p><p>seventh</p></html`,
    numberOfLines: 4,
  },
  {
    name: 'a number of paragraphs much greater than the given limit and the last one overflows',
    slug: 'multiple-short-paragraphs-with-last-overflow',
    html: `<html<p>first</p><p>second</p><p>third</p><p>fourth</p><p>fifth</p><p>sixth</p><p>seventh line that will be long enough that it overflows to the next 8th line</p></html`,
    numberOfLines: 4,
  },
  {
    name: 'some text between empty paragraphs',
    slug: 'between-empty-paragraphs',
    html: `<html<p></p><p>between empty paragraphs</p><p></p></html>`,
    numberOfLines: 2,
  },
  {
    name: 'some empty paragraphs in the middle',
    slug: 'empty-in-the-middle',
    html: `<html<p>first line</p><p></p><p></p><p></p><p>last line</p></html>`,
    numberOfLines: 2,
  },
  {
    name: 'unordered list',
    slug: 'unordered-list',
    html: `<html><ul><li>first</li><li>second</li><li>third</li></ul></html>`,
    numberOfLines: 2,
  },
  {
    name: 'unordered list with empty elements',
    slug: 'unordered-list-with-empty',
    html: `<html><ul><li></li><li>second</li><li></li><li>fourth</li></ul></html>`,
    numberOfLines: 3,
  },
  {
    name: 'unordered list with only empty elements',
    slug: 'unordered-list-only-empty',
    html: `<html><ul><li></li><li></li><li></li></ul></html>`,
    numberOfLines: 2,
  },
  {
    name: 'ordered list',
    slug: 'ordered-list',
    html: `<html><ol><li>first</li><li>second</li><li>third</li></ol></html>`,
    numberOfLines: 2,
  },
  {
    name: 'ordered list with empty elements',
    slug: 'ordered-list-with-empty',
    html: `<html><ol><li></li><li>second</li><li></li><li>fourth</li></ol></html>`,
    numberOfLines: 3,
  },
  {
    name: 'ordered list with only empty elements',
    slug: 'ordered-list-only-empty',
    html: `<html><ol><li></li><li></li><li></li></ol></html>`,
    numberOfLines: 2,
  },
  {
    name: 'checkbox list',
    slug: 'checkbox-list',
    html: `<html><ul data-type="checkbox"><li checked>first</li><li>second</li><li>third</li></ul></html>`,
    numberOfLines: 2,
  },
  {
    name: 'checkbox list with empty elements',
    slug: 'checkbox-list-with-empty',
    html: `<html><ul data-type="checkbox"><li checked></li><li>second</li><li></li><li>fourth</li></ul></html>`,
    numberOfLines: 3,
  },
  {
    name: 'checkbox list with only empty elements',
    slug: 'checkbox-list-only-empty',
    html: `<html><ul data-type="checkbox"><li checked></li><li></li><li></li></ul></html>`,
    numberOfLines: 2,
  },
  {
    name: 'different paragraph style',
    slug: 'different-paragraph-style',
    html: `<html><blockquote><p>this is a pretty long blockquote - a different block style paragraph, long enough to overflow in the given number of lines.</p></blockquote></html>`,
    numberOfLines: 2,
  },
  {
    name: 'different paragraph style with an empty line',
    slug: 'different-paragraph-style-with-empty-line',
    html: `<html><blockquote><p>this is a pretty short blockquote.</p><br><p>This is a line after an empty line.</p></blockquote></html>`,
    numberOfLines: 2,
  },
  {
    name: 'mixing different paragraph styles',
    slug: 'paragraph-styles-mix',
    html: `<html><p>This is a normal paragraph.</p><codeblock><p>This is a codeblock that will be long enough to overflow.</p></codeblock></html>`,
    numberOfLines: 2,
  },
  {
    name: 'inline images',
    slug: 'inline-images',
    html:
      `<html><p>This is a line with an inline <img src="asd" width="80" height="80"/>image.` +
      `</p><p>This is a second line and the inline image <img src="asd" width="80" height="80"/> ` +
      `will make it overflow to the next line.</p><p>This is the last line with an <img src="asd" width="80" height="80"/>inline image.</p></html>`,
    numberOfLines: 2,
  },
];

for (const mode of MODES) {
  test.describe(`EnrichedText ellipsize - ${mode}`, () => {
    for (const c of SHARED_CASES) {
      test(c.name, async ({ page }) => {
        await gotoTestEllipsize(page);
        await setValue(page, c.html);
        await setNumberOfLines(page, c.numberOfLines);
        await setMode(page, mode);

        await expect(displayLocator(page)).toHaveScreenshot(
          `ellipsize-${c.slug}-${mode}.png`
        );
      });
    }
  });
}
