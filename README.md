
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


## Inlining

This will extract any `style` elements included in the document, and all their
rules.  It will also extract any external stylesheets that use relative URLs.
These stylesheets will be loaded from the cache.

Both elements are then removed from the DOM.

External stylesheets that reference absolute URLs (anything with a host) are
retained as is.  These are expected to be resolved when the document is
rendered in the browser.

Styles are processed in document order, i.e. the order in which the `style`
element appears or style references are linked to in the document.

Rules that can be applied to the `style` attribute of an element (inlined) are
applied to any matching element (may be none) and discarded.

Rules that cannot be applied are preserved and added back to the document inside
a new `style` element.  Rules that cannot be inlined include pseudo selectors
(e.g. `:hover`, `::after`) as well as all media queries (e.g. `@media print`).

If a rule has multiple selectors, it may be inlined with one selector, and
included in the document with another selector.




