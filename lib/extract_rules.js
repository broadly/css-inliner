// Extracts style information from the document.
//
// This will extract any `style` elements included in the document, and any
// external stylesheets with resolvable URLs.
//
// These elements are then removed from the DOM, which is modified in place.

'use strict';
const CSSselect   = require('css-select');
const DOMUtils    = require('domutils');
const ElementType = require('domelementtype');
const Immutable   = require('immutable');


// { dom, cache, resolve } -> promise({ dom, rules, warnings })
//
// dom      - The document
// cache    - Load, compile and cache rules
// resolve  - Resolve relative paths to filenames
//
// Resolves to object with the properties:
//
// dom      - The modified DOM
// rules    - All rules in document order
// warnings - All warnings reported while processing stylesheets
module.exports = function extractStylesheetsAsync(context) {
  return extractResultsAsync(context)
    .then(function(result) {
      const dom      = context.dom;
      const rules    = result.rules;
      const warnings = result.warnings;
      return { dom, rules, warnings };
    });
};


// -- Extract stylesheets --

// (dom, stylesheets) -> promise([ { rules, warnings } ])
//
// Extracts stylesheets from the DOM.  Returns a promise that resolves to a list
// of results.
function extractResultsAsync(context) {
  const dom     = context.dom;
  const cache   = context.cache;
  const resolve = context.resolve;

  const styleElements  = CSSselect.selectAll('style, link[rel~="stylesheet"]', dom);

  const resultPromises = styleElements
    .map(function(element) {

      if (isStyleElement(element)) {

        DOMUtils.removeElement(element);
        const css           = DOMUtils.getText(element);
        const resultPromise = cache.compile(css);
        return resultPromise;

      } else if (resolve) {

        const href        = DOMUtils.getAttributeValue(element, 'href');
        const filename    = resolve(href);
        if (filename) {
          DOMUtils.removeElement(element);
          const resultPromise = cache.load(filename);
          return resultPromise;
        } else
          return null;

      } else
        return null;

    })
    .filter(function(result) {
      return result;
    });

  const mergedPromise = Promise.all(resultPromises)
    .then(function(results) {
      const list     = Immutable.List(results);
      const rules    = list.flatMap(result => result.rules);
      const warnings = list.flatMap(result => result.warnings);
      return { rules, warnings };
    });
  return mergedPromise;
}


function isStyleElement(element) {
  return element.type === ElementType.Style;
}

