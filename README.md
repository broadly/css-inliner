
Example:

```js
const inliner = new CSSInliner({
  directory: 'stylesheets'
});

inliner.inlineAsync(html)
  .then(function(result) {
    console.log(result.inlined);
  });
```


## Configuring

First, create a new `CSSInliner` object.  The inliner object serves as a cache
for processed stylesheets, inlined documents, and other assets.  You don't have
to keep it around, but it is useful to speed up processing.

You configure the inliner with the following options:

`directory` - This is the base directory that contains all external stylesheets
that are available for use.

`plugins`   - Array of PostCSS plugins.

`resolve`   - This is a function that loads an external stylesheet, if you want
something other than setting a directory.

If the source document links to any external stylesheet with with a relative URL
(path only), then the inliner will attempt to resolve this stylesheet using the
supplied `resolve` function.

The most common configuration is for external stylesheets to exist in a known
location in the file system, and this can be set using the `directory` option
(instead, not in addition to, the `resolve` options).  Only files in that
directory or sub-directory are accessible.

If you don't specify either options, inliner will not be able to resolve
external stylesheets.  However, it can still process `style` elements appearing
in the document.


## How It Works

The inliner extracts any `style` elements appearing in the document, with all
their rules.  It also extracts any external stylesheets that use relative URLs.
Both stylesheets are processed using PostCSS and any plugins you opt to use, and
cached in memory.

The `style` element and `link` element to known stylesheet are then removed from
the document.  These rules will be inlined or added back into the document
later.

External stylesheets that reference absolute URLs (anything with a hostname,
such as `//example.com/`) are retained in the document.  These are expected to
resolve when the document is rendered in the browser or email client.

Styles are processed in document order, that is, the order in which the `style`
or `link` elements appear in the document, such that the early rules take
precedence (for the same specificity).

Rules that can be applied to the `style` attribute of an element (inlined), are
applied to any matching element found in the document, if there is one.  They
are always discarded.

Rules that cannot be applied, are kept as is, and added back to the document
inside a new `style` elements.  These become accessible to browsers or email
clients that refuse to load external stylesheets, but will still process `style`
elements included in the document (e.g. GMail).

Rules that cannot be inlined include pseudo selectors such as `:hover` and
`::after`, as well as all media queries such as `@media screen`.  These can only
be applied to a live document when rendered by a browser.

If a rule has multiple selectors, it may be inlined using one selector, and
included in the document with another selector.


## References

[CSS 3: Calculating a selector's specificity](http://www.w3.org/TR/css3-selectors/#specificity)

[PostCSS API](https://github.com/postcss/postcss/blob/master/docs/api.md)

[PostCSS Selector Parser API](https://github.com/postcss/postcss-selector-parser/blob/master/API.md)

