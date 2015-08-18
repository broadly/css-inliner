// Extracts style information from the document.
//
// This will extract any `style` elements included in the document, and any
// external stylesheets with relative URLs.
//
// These elements are then removed from the DOM, which is modified in place.
//
// The rules are then collected in document order, and marked for inlining or
// inclusion.
//
// Resolves to an object with the properties:
//
// dom      - The modified DOM
// inline   - All rules that can be used for inlining
// include  - All rules that should be included in document
// warnings - All warnings reported while processing stylesheets

'use strict';
const _           = require('lodash');
const CSSselect   = require('css-select');
const DOMUtils    = require('domutils');
const ElementType = require('domelementtype');


// (dom, stylesheets) -> promise({ rules, warnings })
module.exports = function extractStylesheetsAsync(dom, stylesheets) {
  return extractResultsAsync(dom, stylesheets)
    .then(function(results) {
      return {
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
function extractResultsAsync(dom, stylesheets) {
  const styleElements   = CSSselect.selectAll('style, link[rel~="stylesheet"]', dom);

  const resultPromises  = styleElements
    .map(function(element) {

      if (isStyleElement(element)) {
        DOMUtils.removeElement(element);
        const css           = DOMUtils.getText(element);
        const resultPromise = stylesheets.cache(css);
        return resultPromise;
      }

      if (isKnownStylesheet(element)) {
        DOMUtils.removeElement(element);

        const href        = DOMUtils.getAttributeValue(element, 'href');
        const resultAsync = stylesheets.load(href);
        return resultAsync;
      }

    });

  return Promise.all( _.compact(resultPromises) );
}


function isStyleElement(element) {
  return element.type === ElementType.Style;
}

function isKnownStylesheet(element) {
  if (element.name === 'link') {
    const href     = DOMUtils.getAttributeValue(element, 'href');
    const absolute = /^https?:/.test(href);
    return !absolute;
  } else
    return false;
}


// -- Collect rules --


// [ Result ] -> [ rule ]
//
// Collects all rules from parsed stylesheets
function collectRules(results) {
  const rules  = [];

  function addRule(rule) {
    const isRule    = (rule.type === 'rule' || rule.type === 'atrule');
    const topLevel  = (rule.parent.type === 'root');

    if (isRule && topLevel) {
      rule.removeSelf();
      rules.push(rule);
    }
  }

  for (let result of results) {
    result.root.cleanStyles();
    result.root.each(addRule);
  }

  return rules;
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
