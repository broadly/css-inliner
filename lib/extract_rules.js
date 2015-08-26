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
    .then(function(results) {
      return {
        dom:      context.dom,
        rules:    collectRules(results),
        warnings: collectWarnings(results)
      };
    });
};


// -- Extract stylesheets --

// (dom, stylesheets) -> promise([ Result ])
//
// Extracts stylesheets from the DOM.  Returns a promise that resolves to array
// of Result objects.
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

  return Promise.all(resultPromises);
}


function isStyleElement(element) {
  return element.type === ElementType.Style;
}


// -- Collect rules --

// [ Result ] -> [ rule ]
//
// Collects all rules from parsed stylesheets
function collectRules(results) {
  const rules  = [];

  function addRule(node) {
    if (isRule(node) && isTopLevel(node))
      rules.push(node);
  }

  for (let result of results) {
    result.root.cleanStyles();
    result.root.each(addRule);
  }

  return rules;
}


function isRule(node) {
  return (node.type === 'rule' || node.type === 'atrule');
}

function isTopLevel(node) {
  return (node.parent.type === 'root');
}


// [ Result ] -> [ string ]
//
// Collects all warnings from parsed stylesheets
function collectWarnings(results) {
  const warnings = [];

  function addWarning(warning) {
    warnings.push( warning.toString() );
  }

  for (let result of results)
    result.warnings().forEach(addWarning);
  return warnings;
}

