// Extracts style information from the document.
//
// This will extract any `style` elements included in the document, and any
// external stylesheets with relative URLs.
//
// These elements are then removed from the DOM, which is modified in place.
//
// The rules are then collected in document order, and identified as either
// inlining or preserved.
//
// Resolves to an object with the properties:
//
// dom      - The modified DOM
// inline   - All rules that can be used for inlining
// preserve - All rules that must be preserved in document
// warnings - All warnings reported while processing stylesheets

'use strict';
const _               = require('lodash');
const CSSselect       = require('css-select');
const DOMUtils        = require('domutils');
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
  return element.type === 'style';
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


// [ Result ] -> { inline, preserve }
//
// Collects all rules from parsed stylesheets
function collectRules(results) {
  const inline    = [];
  const preserve  = [];

  function preserveRule(atRule) {
    preserve.push(atRule);
  }

  function addRule(rule) {
    const topLevelRule = (rule.parent.type === 'root');
    if (!topLevelRule)
      return;

    const specific = identifyRules(rule);
    if (specific.dynamic)
      preserveRule(specific.dynamic);
    if (specific.inlining)
      inline.push(specific.inlining);
  }

  for (let result of results) {
    result.root.eachAtRule(preserveRule);
    result.root.eachRule(addRule);
  }

  return { inline, preserve };
}


// Rule -> { dynamic, inlining }
//
// If the rules has any selectors that support inlining, returns the property
// `inlining` with the value being that rule.
//
// If the rules has any selectors that do not support inlining, returns the
// property `dynamic` with the value being that rule.
function identifyRules(rule) {
  const dynamic   = [];
  const inlining  = [];

  for (let selector of rule.selectors)
    if (isDynamicSelector(selector))
      dynamic.push(selector);
    else
      inlining.push(selector);

  return {
    dynamic:  dynamic.length  ? rule.clone({ selectors: dynamic }) : null,
    inlining: inlining.length ? rule.clone({ selectors: inlining }) : null
  };
}


// Returns true if the selector is a dynamic selector (e.g. pseudo element)
// that cannot be used for inlining.
function isDynamicSelector(selector) {
  let dynamic = false;

  selectorParser(function(nodes) {
    nodes.eachInside(function(node) {
      if (node.type === 'pseudo')
        dynamic = true;
      // Attribute values?
    });
  }).process(selector);

  return dynamic;
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


// (dom, stylesheets) -> promise({ dom, inline, preserve, warnings })
module.exports = function extractStylesheetsAsync(dom, stylesheets) {

  return extractResultsAsync(dom, stylesheets)
    .then(function(results) {
      const collected = collectRules(results);
      const warnings  = collectWarnings(results);
      return {
        dom,
        inline:   collected.inline,
        preserve: collected.preserve,
        warnings
      };
    });

};

