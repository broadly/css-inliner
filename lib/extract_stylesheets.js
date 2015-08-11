// Extracts inlining stylesheets from the document.

'use strict';
const CSSselect = require('css-select');
const DOMUtils  = require('domutils');


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



// [ Result ] -> [ Rule ]
//
// Collects all rules from parsed stylesheets
function collectRules(results) {
  const rules = [];

  function addRule(rule) {
    const topLevelRule = (rule.parent.type === 'root');
    if (topLevelRule)
      rules.push(rule);
  }

  for (let result of results) {
    result.root.eachAtRule(addRule);
    result.root.eachRule(addRule);
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


// (dom, stylesheets) -> promise({ dom, rules, warnings })
//
// dom          - htmlparser2 DOM
// stylesheets  - Stylesheets for caching and loading stylesheets
// rules        - Array of PostCSS rules and @ rules
// warnings     - All warnings reported by PostCSS
//
// Extracts inlining stylesheets from the DOM.  Resolves to the modified DOM,
// all rules, and all warnings.
//
// Rules are collected in document order first (i.e. order in which styles are
// referenced in the document), and order within the stylesheet second.
module.exports = function extractStylesheetsAsync(dom, stylesheets) {

  return extractResultsAsync(dom, stylesheets)
    .then(function(results) {
      const warnings = collectWarnings(results);
      const rules    = collectRules(results);
      return { dom, rules, warnings };
    });

};

