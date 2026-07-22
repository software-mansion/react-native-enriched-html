---
sidebar_position: 4
---

# HTML format and supported tags

The editor works with a fixed set of standard and custom HTML tags - it both
produces them in its output and accepts them as input. This page is the
reference for that set.

Styles fall into two groups: **inline** tags that wrap a range of characters,
and **paragraph** tags that apply to whole lines. Not all of them combine
freely, and there are two kinds of restriction:

- **Conflicting** - toggling a style that conflicts with an active one replaces
  it. Toggling `<h2>` on a `<blockquote>` paragraph removes the blockquote and
  applies the heading.
- **Blocking** - a blocked style can't be toggled at all while the blocking
  style is active. `<b>` is blocked inside `<codeblock>`, so bold can't be
  applied there.

Both show up in the [`onChangeState`](/fundamentals/core-concepts#the-style-state-model) payload as
`isConflicting` and `isBlocking`.

## Inline tags

| Style         | HTML tag    | Conflicts with               | Blocked by             |
| ------------- | ----------- | ---------------------------- | ---------------------- |
| Bold          | `<b>`       | --                           | `<codeblock>`          |
| Italic        | `<i>`       | --                           | `<codeblock>`          |
| Underline     | `<u>`       | --                           | `<codeblock>`          |
| Strikethrough | `<s>`       | --                           | `<codeblock>`          |
| Inline code   | `<code>`    | `<a>`, `<mention>`           | `<codeblock>`, `<img>` |
| Link          | `<a>`       | `<code>`, `<a>`, `<mention>` | `<codeblock>`, `<img>` |
| Mention       | `<mention>` | `<code>`, `<a>`              | `<codeblock>`, `<img>` |
| Image         | `<img>`     | `<a>`, `<mention>`           | `<code>`               |

:::note

Headings also block bold when `bold: true` is set on the heading in the
`htmlStyle` prop. The heading already renders as bold, so toggling bold on top
of it is redundant and therefore blocked.

:::

## Paragraph tags

Only one paragraph-level style can be active per paragraph - they all conflict
with each other.

Some paragraph styles are containers that wrap each line inside them with an
**inner content tag**. Each line of a `<ul>` is wrapped in `<li>`, and each line
of a `<codeblock>` is wrapped in `<p>`.

| Style          | HTML tag                    | Inner content tag       | Conflicts with                                                                                                                                                        | Blocked by |
| -------------- | --------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Heading 1      | `<h1>`                      | --                      | `<h2>`, `<h3>`, `<h4>`, `<h5>`, `<h6>`, `<ul>`, `<ol>`, `<ul data-type="checkbox">`, `<blockquote>`, `<codeblock>`                                                    | --         |
| Heading 2      | `<h2>`                      | --                      | `<h1>`, `<h3>`, `<h4>`, `<h5>`, `<h6>`, `<ul>`, `<ol>`, `<ul data-type="checkbox">`, `<blockquote>`, `<codeblock>`                                                    | --         |
| Heading 3      | `<h3>`                      | --                      | `<h1>`, `<h2>`, `<h4>`, `<h5>`, `<h6>`, `<ul>`, `<ol>`, `<ul data-type="checkbox">`, `<blockquote>`, `<codeblock>`                                                    | --         |
| Heading 4      | `<h4>`                      | --                      | `<h1>`, `<h2>`, `<h3>`, `<h5>`, `<h6>`, `<ul>`, `<ol>`, `<ul data-type="checkbox">`, `<blockquote>`, `<codeblock>`                                                    | --         |
| Heading 5      | `<h5>`                      | --                      | `<h1>`, `<h2>`, `<h3>`, `<h4>`, `<h6>`, `<ul>`, `<ol>`, `<ul data-type="checkbox">`, `<blockquote>`, `<codeblock>`                                                    | --         |
| Heading 6      | `<h6>`                      | --                      | `<h1>`, `<h2>`, `<h3>`, `<h4>`, `<h5>`, `<ul>`, `<ol>`, `<ul data-type="checkbox">`, `<blockquote>`, `<codeblock>`                                                    | --         |
| Unordered list | `<ul>`                      | `<li>`                  | `<h1>`, `<h2>`, `<h3>`, `<h4>`, `<h5>`, `<h6>`, `<ol>`, `<ul data-type="checkbox">`, `<blockquote>`, `<codeblock>`                                                    | --         |
| Ordered list   | `<ol>`                      | `<li>`                  | `<h1>`, `<h2>`, `<h3>`, `<h4>`, `<h5>`, `<h6>`, `<ul>`, `<ul data-type="checkbox">`, `<blockquote>`, `<codeblock>`                                                    | --         |
| Checkbox list  | `<ul data-type="checkbox">` | `<li>` / `<li checked>` | `<h1>`, `<h2>`, `<h3>`, `<h4>`, `<h5>`, `<h6>`, `<ul>`, `<ol>`, `<blockquote>`, `<codeblock>`                                                                         | --         |
| Blockquote     | `<blockquote>`              | `<p>`                   | `<h1>`, `<h2>`, `<h3>`, `<h4>`, `<h5>`, `<h6>`, `<ul>`, `<ol>`, `<ul data-type="checkbox">`, `<codeblock>`                                                            | --         |
| Codeblock      | `<codeblock>`               | `<p>`                   | `<h1>`, `<h2>`, `<h3>`, `<h4>`, `<h5>`, `<h6>`, `<b>`, `<u>`, `<i>`, `<s>`, `<ul>`, `<ol>`, `<ul data-type="checkbox">`, `<blockquote>`, `<code>`, `<mention>`, `<a>` | --         |

## Plain and empty paragraphs

A plain line of text with no paragraph style is wrapped in `<p>`. An empty line
is represented by `<br>`. So a document with a heading, a blank line and a
paragraph comes out like this:

```html
<html>
  <h1>Title</h1>
  <br>
  <p>Some body text.</p>
</html>
```
