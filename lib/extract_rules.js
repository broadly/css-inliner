// This stage extracts all the rules we're going to use in the next stages.
//
// For any <style> element, and <link> element that loads CSS from the file
// system, it will:
// - Extract the CSS and parse its rules
// - Collect all rules in order in which they appear in document
// - Discard the style/link element

'use strict';
const assert      = require('assert');
const CSSselect   = require('css-select');
const debug       = require('./debug');
const DOMUtils    = require('domutils');
const ElementType = require('domelementtype');
const Immutable   = require('immutable');


// Input:  context with dom and cache
// Output: context gains rules, mutates dom
module.exports = function extractRules(context) {
  const dom     = context.dom;
  const cache   = context.cache;
  const inliner = context.inliner;
  assert(dom,     'Expected context to contain dom property');
  assert(cache,   'Expected context to contain cache property');
  assert(inliner, 'Expected context to contain inliner property');

  debug('%s: Extracting stylesheets', context.filename);
  return extractFromDocumentAsync(cache, dom)
    .then(function(results) {
      const rules     = results.rules;
      const warnings  = results.warnings;
      emitWarnings(inliner, warnings);
      return context.set('rules', rules);
    });
};


// (cache, dom) -> promise({ rules, warnings })
//
// Handle <style> or <link> elements in the DOM, removed them, and resolves to
// all rules contained/referenced there.
function extractFromDocumentAsync(cache, dom) {
  const cssElements     = CSSselect.selectAll('style, link[rel~="stylesheet"]', dom);
  const resultPromises  = cssElements.map(element => extractFromElementAsync(cache, element) );
  const mergedPromise   = Promise.all(resultPromises).then(mergeResults);
  return mergedPromise;
}


// [ result ] -> result
//
// Merges all rules and warnings
function mergeResults(results) {
  const resultsList     = Immutable.List(results);
  const rules           = resultsList.flatMap(result => result.rules);
  const warnings        = resultsList.flatMap(result => result.warnings);
  return { rules, warnings };
}


// (cache, element) -> promise({ rules, warnings })
//
// Handle <style> or <link> element and resolves to all rules contained/referenced there.
function extractFromElementAsync(cache, element) {
  if (isStyleElement(element)) {

    DOMUtils.removeElement(element);
    const css           = DOMUtils.getText(element);
    const resultPromise = cache.compileAsync(css);
    return resultPromise;

  } else if (isLocalStylesheet(element)) {

    DOMUtils.removeElement(element);
    const relativeURL   = DOMUtils.getAttributeValue(element, 'href');
    const resultPromise = cache.loadAsync(relativeURL);
    return resultPromise;

  } else
    return Promise.resolve({});
}


// Is this a <style> element?
function isStyleElement(element) {
  return element.type === ElementType.Style;
}


// Is this a <link> element that reference a local stylesheet?
function isLocalStylesheet(element) {
  const isLinkElement       = (element.name === 'link');
  const isStylesheet        = (element.attribs.rel === 'stylesheet');
  const isLocal             = isLocalURL(element.attribs.href);
  return isLinkElement && isStylesheet && isLocal;
}


// Is this URL path only (no protocol: or //hostname)?
function isLocalURL(url) {
  const startsWithProtocol  = /^\w+:/.test(url);
  const startsWithHostname  = url && url.startsWith('//');
  return url && !startsWithProtocol && !startsWithHostname;
}


// PostCSS collects warnings, so we emit them all at the end
function emitWarnings(inliner, warnings) {
  for (let warning of warnings)
    inliner.emit('warning', warning);
}

