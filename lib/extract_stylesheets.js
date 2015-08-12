// Extracts style information from the document.
//
// Modifies the DOM, removing inlined styles and returning the modified DOMs,
// inlining rules and preserved CSS.
//
// Resolves to an object with the properties:
//
// dom      - The modified DOM
// inline   - All rules that can be used for inlining
// preserve - All rules that must be preserved in document
// warnings - All warnings reported while processing stylesheets
//
// The DOM is modified, removing any `style` elements and resolved external
// stylesheets, that are processed into rules or preserved CSS.  External
// stylesheets that point to absolute URLs are not processed.
//
// Inlining rules are all the CSS rules that can be applied to elements
// directly, and inlined into the `style` attribute.
//
// Certain rules cannot be inlined (e.g. pseudo elements, media queries), these
// are returned to be included in the resulting document (preserved).

'use strict';
const CSSselect       = require('css-select');
const DOMUtils        = require('domutils');
const selectorParser  = require('postcss-selector-parser');


// -- Extract stylesheets --

// (dom, stylesheets) -> promise([ Result ])
//
// Extracts stylesheets from the DOM.  Returns a promise that resolves to array
// of Result objects.
function extractResultsAsync(dom, stylesheets) {
  const fromStyleElements   = extractStyleElements(dom, stylesheets);
  const externalStylesheets = extractExternalStylesheets(dom, stylesheets);
  const resultPromises      = fromStyleElements.concat(externalStylesheets);
  return Promise.all(resultPromises);
}


// (dom, stylesheets) -> promise([ Result ])
//
// extractResultsAsync uses this to extract style elements from the DOM.
function extractStyleElements(dom, stylesheets) {
  const styleElements   = CSSselect.selectAll('style', dom);
  const resultPromises  = styleElements
    .map(function(element) {

      DOMUtils.removeElement(element);

      const css           = DOMUtils.getText(element);
      const resultPromise = stylesheets.cache(css);
      return resultPromise;
    });
  return resultPromises;
}


// (dom, stylesheets) -> promise([ Result ])
//
// extractResultsAsync uses this to extract link elements that reference
// external stylesheets (only relative URLs) from the DOM.
function extractExternalStylesheets(dom, stylesheets) {
  const styleElements   = CSSselect.selectAll('link[rel~="stylesheet"]', dom);
  const relativeStyles  = styleElements.filter(isRelativeHREF);
  const resultPromises  = relativeStyles
    .map(function(element) {

      DOMUtils.removeElement(element);

      const href        = DOMUtils.getAttributeValue(element, 'href');
      const resultAsync = stylesheets.load(href);
      return resultAsync;
    });
  return resultPromises;
}

function isRelativeHREF(element) {
  const href        = DOMUtils.getAttributeValue(element, 'href');
  const absolute    = /^https?:/.test(href);
  return !absolute;
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
    if (isDynamic(selector))
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
function isDynamic(selector) {
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

