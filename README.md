
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


