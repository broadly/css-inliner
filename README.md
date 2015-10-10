# CSSInliner

A simple and modern CSS inliner. Optionally supports CSS preprocessors
(e.g. Less) and templating languages (e.g. Handlebars).

[![NPM](https://img.shields.io/npm/v/css-inliner.svg?style=flat-square&label=latest)](https://www.npmjs.com/package/css-inliner)
[![Changelog](https://img.shields.io/badge/see-CHANGELOG-red.svg?style=flat-square)](https://github.com/broadly/css-inliner/blob/master/CHANGELOG.md)
<img width="12" src="data:image/gif;base64,R0lGODlhAQABAPAAAP">
[![Travis.ci](https://img.shields.io/travis/broadly/css-inliner.svg?style=flat-square)](https://travis-ci.org/broadly/css-inliner)
<img width="12" src="data:image/gif;base64,R0lGODlhAQABAPAAAP">


# Usage

```js
const inliner = new CSSInliner({
  directory: 'stylesheets'
});

inliner.inlineCSSAsync(html)
  .then(function(result) {
    console.log(result.inlined);
  });
```


## Configuring

First, create a new `CSSInliner` object.  The inliner object serves as a cache
for processed stylesheets, inlined documents, and other assets.  You don't have
to keep it around, but it is useful to speed up processing.

You configure the inliner with the following options:

`directory` - The base directory from which local stylesheets are loaded. Only
files in this directory or its sub-directories are accessible.

`plugins`    - Array of [PostCSS plugins][postcss-plugins] to use while processing
stylesheets.

`precompile` - A function that precompiles a stylesheet into CSS. See [the
preprocessors section][preprocessors-section].

`template`   - A function that can extract tags from a templating language. See
the [templates section][templates-section].

`loadAsync` - A function that reads a stylesheet reference (path or URL) into
a Buffer or string. Recommended only when `directory` and `precompile` are not
enough.


## How It Works

The inliner extracts any `style` elements appearing in the document, with all
their rules.  It also extracts any external stylesheets that use relative URLs.
All stylesheets are processed using PostCSS and any plugins you opt to use, and
cached in memory.

The `style` elements and `link` elements to known stylesheet are then removed
from the document.  Their rules will either be inlined or added back into the
document later.

External stylesheets that reference absolute URLs (anything with a hostname,
such as `//example.com/`) are retained in the document.  These are expected to
resolve when the document is rendered in the browser or email client.

Styles are processed in document order, that is, the order in which the `style`
or `link` elements appear in the document, such that the early rules take
precedence (for the same specificity).

Rules that can be applied to the `style` attribute of an element (inlined) are
applied to any matching element found in the document, if there is one.  These
are never added back into a `style` element in the document.

Rules that cannot be inlined include pseudo selectors such as `:hover` and
`::after`, as well as all media queries such as `@media screen`.  These can only
be applied to a live document when rendered by a browser or email client.
Thus they are added back to the document inside a `style` element.

If a rule has multiple selectors, it may be inlined using one selector, and
included in the document with another selector.


## Working with preprocessors (Less, Sass, Stylus, etc)

If you're working with a language that compiles to CSS, you need to use the
`precompile` option.

A precompile function for Less is included by default, and you can use it like
this:

```js
const precompile  = CSSInliner.less;
const inliner     = new CSSInliner({ precompile });
```

(Less is an optional dependency, so you need to add it in your `package.json` if
you want to use it.)

The `precompile` option takes a function that will be called with two arguments:
the pathname, and the stylesheet.  You can use the pathname to determine the
file type based on its extension (e.g. does it end with `.less`?)

The function should return the compiled CSS in the form of a string or a Buffer,
or a promise that resolves to a string or Buffer.


## Working with templates (Handlebars, etc)

Inlining requires parsing the document as HTML, and when there are non-HTML
tags in the document, they are often parsed incorrectly.  Many templating
languages use non-HTML tags.

Use the `template` option with an appropriate template parser.  For example,
when working with Handlebars templates:

```js
const template  = CSSInliner.handlebars;
const inliner   = new CSSInliner({ template });
```

(Handlebars is an optional dependency, so you need to add it in your
`package.json` if you want to use it.)

The template handler is a function that will be called with the source template,
and must return an array of all template tags found there.

These tags are then replaced with HTML-compatible markers before parsing and
inlining, and are restored before resolving to the final document.

Note: you shouldn't use the templating language to define a class inside a
`class` attribute. CSSInliner doesn't run the template - it only inlines styles
as if the template tags weren't there. If you need to define an element's class
based on a condition:

```html
<!-- Don't do this -->
<div class="{{ active_or_inactive }}"></div>

<!-- Do this instead -->
{{#if active}}
  <div class="active"></div>
{{else}}
  <div class="inactive"></div>
{{/if}}
```


## Watching for warnings

The inliner may report warnings while processing CSS or HTML documents by
emitting a `warning` event.

You can use an event handler to catch and log the warning.  You can also halt
processing by throwing an error from your event handler.  If there are no event
handlers, warnings will be logged to stderr.

```js
const inliner = new CSSInliner(options);
inliner.on('warning', function(warning) {
  console.log('So this happened:', warning);
});
```


## References

[CSS 3: Calculating a selector's specificity](http://www.w3.org/TR/css3-selectors/#specificity)

[PostCSS API](https://github.com/postcss/postcss/blob/master/docs/api.md)

[PostCSS Selector Parser API](https://github.com/postcss/postcss-selector-parser/blob/master/API.md)


[postcss-plugins]:       https://github.com/postcss/postcss#plugins
[preprocessors-section]: #working-with-preprocessors-less-sass-stylus-etc
[templates-section]:     #working-with-templates-handlebars-etc
