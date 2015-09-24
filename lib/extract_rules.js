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


// Input:  context with dom, cache, resolve
// Output: context gains rules and warnings, DOM mutated
module.exports = function extractRules(context) {
  return extractResultsAsync(context)
    .then(function(result) {
      const rules    = result.rules;
      const warnings = result.warnings;
      const modified = context.set('rules', rules).set('warnings', warnings);
      return modified;
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

  const styleElements  = CSSselect.selectAll('style, link[rel~="stylesheet"]', dom);

  const resultPromises = styleElements
    .map(function(element) {

      if (isStyleElement(element)) {

        DOMUtils.removeElement(element);
        const css           = DOMUtils.getText(element);
        const resultPromise = cache.compile(css);
        return resultPromise;

      } else if (isLocalStylesheet(element)) {

        const url = DOMUtils.getAttributeValue(element, 'href');
        DOMUtils.removeElement(element);
        const resultPromise = cache.load(url);
        return resultPromise;

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

function isLocalStylesheet(element) {
  const url = DOMUtils.getAttributeValue(element, 'href');
  const startsWithProtocol = /^\w+:/.test(url);
  const startsWithHostname = url && url.startsWith('//');
  return url && !startsWithProtocol && !startsWithHostname;
}

