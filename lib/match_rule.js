// A rule matcher tests if the element matches any of the selectors associated
// with that rule, and if it does, returns all the properties.

'use strict';
const calculateSpecificity  = require('./calc_specificity');
const CSSselect             = require('css-select');
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
  const declarations = rule.nodes.filter(node => node.type === 'decl');
  const applicable   = rule.selectors.filter(canApplyInline);
  const matchers     = applicable.map(selector => matcherFromSelector(selector, declarations));
  matchers.sort((a, b)=> b.specificity - a.specificity);

  return function(element) {
    for (let match of matchers) {
      let properties = match(element);
      if (properties)
        return properties;
    }
    return null;
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
// A matcher is a function as defined above, and will also have a specificity
// property.  This property can be used to sort from most to least specific
// selector.
function matcherFromSelector(selector, declarations) {
  const match       = CSSselect.compile(selector);
  const specificity = calculateSpecificity(selector);
  const properties  = declarationsToProperties(declarations, specificity);

  const matcher = function(element) {
    return match(element) ? properties : null;
  };
  matcher.specificity = specificity;
  return matcher;
}


// Converts PostCSS declarations to our CSS property object.  We use 'name'
// instead of 'prop', and include the specificity of the selector.
function declarationsToProperties(declarations, specificity) {
  const properties  = declarations.map(function(decl) {
    const name        = decl.prop.trim();
    const value       = decl.value.trim();
    const important   = !!decl.important;
    const property    = { name, value, important, specificity };
    return property;
  });
  return properties;
}

