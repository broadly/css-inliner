// A rule matcher tests if the element matches any of the selectors associated
// with that rule, and if it does, returns all the properties.

'use strict';
const calculateSpecificity  = require('./calc_specificity');
const CSSselect             = require('css-select');
const Immutable             = require('immutable');
const toProperty            = require('./to_property');
const selectorParser        = require('postcss-selector-parser');


// (Rule) -> matcher
//
// Rule matcher factory, accepts a PostCSS Rule object and returns a matcher.
//
// matcher = (element)->([ property ] || null)
//
// A function that, when called with an element, if that element matches any of
// the selectors from the rule, returns the properties declared in the rule,
// otherwise, returns null.
//
// property = { name, value, important, specificity }
//
// Each CSS property has a name, value, the '!important' field, and its
// specificity as a value between '001' and '999'.
module.exports = function matchRule(rule) {
  if (rule.type === 'atrule')
    return function() {};

  const declarations = rule.nodes.filter(node => node.type === 'decl');
  const selectors    = Immutable.List(rule.selectors);
  const applicable   = selectors.filter(canApplyInline);
  const matchers     = applicable
    .map(selector => matcherFromSelector(selector, declarations))
    .sort((a, b)=> b.specificity - a.specificity)
    .toSeq();

  return function(element) {
    const properties = matchers
      .map(matcher => matcher.match(element))
      .find(properties => properties);
    return properties;
  };
};


// Returns true if this selector can be applied inline.
//
// Pseudo selectors cannot be applied inline.
function canApplyInline(selector) {
  const result = selectorParser().process(selector).res;
  const nodes  = result.nodes[0].nodes;
  const pseudo = nodes.some(node => node.type === 'pseudo');
  const inline = !pseudo;
  return inline;
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
  const cssMatch       = CSSselect.compile(selector);
  const specificity = calculateSpecificity(selector);
  const properties  = declarationsToProperties(declarations, specificity);

  function match(element) {
    return cssMatch(element) ? properties : null;
  }
  return { match, specificity };
}


// Converts PostCSS declarations to our CSS property object.  We use 'name'
// instead of 'prop', and include the specificity of the selector.
function declarationsToProperties(declarations, specificity) {
  const properties = Immutable.List(declarations)
    .map(decl => toProperty({ decl, specificity }));
  return properties;
}

