// A rule matcher tests whether a given element matches against any of the
// selectors associated with that rule, and if it does, returns all CSS
// properties declared by this rule.

'use strict';
const calculateSpecificity  = require('./calc_specificity');
const CSSselect             = require('css-select');
const Immutable             = require('immutable');
const toProperty            = require('./to_property');
const selectorParser        = require('postcss-selector-parser');


// Rule -> matcher
//
// Given a PostCSS rule, returns the appropriate matcher function.
//
//
// A matcher function is:
//
// element -> [property] || null
//
// When called with an element, if the element matches, it returns a list of
// all CSS properties, otherwise it returns null.
//
//
// A CSS property is an object with the properties:
// { name, value, important, specificity }
module.exports = function matcherForRule(rule) {
  const declarations = getDeclarations(rule);
  const selectors    = onlyApplicableSelectors(rule);
  const matchers     = selectors.map(selector => matcherFromSelector(declarations, selector));
  return mostSpecificMatcher(matchers);
};


// rule -> [ decl ]
function getDeclarations(rule) {
  return rule.nodes.filter(node => node.type === 'decl');
}


// Return only the applicable selectors from this rule (i.e. not dynamic selectors)
function onlyApplicableSelectors(rule) {
  const applicable = rule.selectors.filter(canApplyInline);
  return applicable;
}


// Returns true if this selector can be applied inline.  Pseudo selectors cannot
// be applied inline.
function canApplyInline(selector) {
  const result        = selectorParser().process(selector).res;
  const selectorNodes = result.nodes[0].nodes;
  const hasPseudo     = selectorNodes.some(node => node.type === 'pseudo');
  const canInline     = !hasPseudo;
  return canInline;
}


// Turns a list of matcher functions into a single function that returns the
// first match, based on the most specific selector.
function mostSpecificMatcher(matchers) {
  // Lazy sequence, so we only run through matchers until find() ends up with something
  const bySpecificity = Immutable.Seq(matchers).sort(bySpecificityDesc);

  return function(element) {
    const properties = bySpecificity
      .map(matcher => matcher.match(element))
      .find(properties => properties);
    return properties;
  };
}


// Use this to sort matchers from highest to lowest specificity.
function bySpecificityDesc(a, b) {
  return (b.specificity - a.specificity);
}


// Returns a matcher for the given selector and set of PostCSS declarations.
//
// (selector, declaration) -> { match, specificity }
//
// A matcher is a function as defined above.  The specificity is used to sort
// matchers from most to least specific.  This is an optimization, so when a
// rule has two matching selectors (e.g. "p#active, p.active") we return
// properties with the highest specificity.
function matcherFromSelector(declarations, selector) {
  const match       = CSSselect.compile(selector);
  const specificity = calculateSpecificity(selector);
  const properties  = declarationsToProperties(declarations, specificity);

  return {
    match(element) {
      return match(element) ? properties : null;
    },
    specificity
  };
}


// Converts PostCSS declarations to our CSS property object.  We use 'name'
// instead of 'prop', and include the specificity of the selector.
function declarationsToProperties(declarations, specificity) {
  const properties = declarations.map(decl => toProperty(specificity, decl));
  return Immutable.List(properties);
}

