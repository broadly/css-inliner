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
module.exports = function matchRule(rule) {
  const matchers = getAllMatchers(rule);
  const matcher  = mergeMatchers(matchers);
  return matcher;
};


// rule -> lazy sequence of matcher functions
function getAllMatchers(rule) {
  const declarations = Immutable.List(rule.nodes).filter(node => node.type === 'decl');
  const selectors    = Immutable.List(rule.selectors);
  const applicable   = selectors.filter(canApplyInline);
  const matchers     = applicable
    .map(selector => matcherFromSelector(selector, declarations))
    .sort((a, b)=> b.specificity - a.specificity)
    .toSeq();
  return matchers;
}


// lazy sequence -> single matcher function
function mergeMatchers(matchers) {
  return function(element) {
    const properties = matchers
      .map(matcher => matcher.match(element))
      .find(properties => properties);
    return properties;
  };
}


// Returns true if this selector can be applied inline.
//
// Pseudo selectors cannot be applied inline.
function canApplyInline(selector) {
  const result    = selectorParser().process(selector).res;
  const nodes     = result.nodes[0].nodes;
  const isPseudo  = nodes.some(node => node.type === 'pseudo');
  const canInline = !isPseudo;
  return canInline;
}


// Returns a matcher for the given selector and set of PostCSS declarations.
//
// (selector, declaration) -> { match, specificity }
//
// A matcher is a function as defined above.  The specificity is used to sort
// matchers from most to least specific.  This is an optimization, so when a
// rule has two matching selectors (e.g. "p#active, p.active") we return
// properties with the highest specificity.
function matcherFromSelector(selector, declarations) {
  const isMatching  = CSSselect.compile(selector);
  const specificity = calculateSpecificity(selector);
  const properties  = declarationsToProperties(declarations, specificity);

  function match(element) {
    return isMatching(element) ? properties : null;
  }
  return { match, specificity };
}


// Converts PostCSS declarations to our CSS property object.  We use 'name'
// instead of 'prop', and include the specificity of the selector.
function declarationsToProperties(declarations, specificity) {
  const properties = declarations.map(decl => toProperty({ decl, specificity }));
  return properties;
}

