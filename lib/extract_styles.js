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
const _               = require('lodash');
const CSSselect       = require('css-select');
const DOMUtils        = require('domutils');
const ElementType     = require('domelementtype');
const selectorParser  = require('postcss-selector-parser');


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


// [ Result ] -> { inline, include }
//
// Collects all rules from parsed stylesheets
function collectRules(results) {
  const inline  = [];
  const include  = [];

  function includeRule(atRule) {
    include.push(atRule);
  }

  function addRule(rule) {
    const topLevelRule = (rule.parent.type === 'root');
    if (!topLevelRule)
      return;

    const specific = identifyRules(rule);
    if (specific.include)
      includeRule(specific.include);
    if (specific.inline)
      inline.push(specific.inline);
  }

  for (let result of results) {
    result.root.eachAtRule(includeRule);
    result.root.eachRule(addRule);
  }

  return { inline, include };
}


// Rule -> { include, inline }
//
// If the rules has any selectors that support inlining, returns the property
// `inline` with the value being that rule.
//
// If the rules has any selectors that do not support inlining, returns the
// property `include` with the value being that rule.
function identifyRules(rule) {
  const include = [];
  const inline  = [];

  for (let selector of rule.selectors)
    if (canApplyInline(selector))
      inline.push(selector);
    else
      include.push(selector);

  return {
    include:  include.length ? rule.clone({ selectors: include }) : null,
    inline:   inline.length  ? rule.clone({ selectors: inline })  : null
  };
}


// Returns true if the selector can be applied to inline element.  Pseudo
// selectors, media queries, etc cannot be used to inline.
function canApplyInline(selector) {
  let pseudo = false;

  selectorParser(function(nodes) {
    nodes.eachInside(function(node) {
      if (node.type === 'pseudo')
        pseudo = true;
    });
  }).process(selector);

  return !pseudo;
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


// (dom, stylesheets) -> promise({ dom, inline, include, warnings })
module.exports = function extractStylesheetsAsync(dom, stylesheets) {

  return extractResultsAsync(dom, stylesheets)
    .then(function(results) {
      const collected = collectRules(results);
      const warnings  = collectWarnings(results);
      return {
        dom,
        inline:  collected.inline,
        include: collected.include,
        warnings
      };
    });

};

