// This stage filters out CSS rules, keeping only the dynamic rules, so they
// can be added back into the document in the next stage.
//
// Dynamic rules are rules that must be applied when the document is rendered,
// by including them in a stylesheet, specifically:
// - All media queries
// - Font faces
// - All rules with pseudo selectors (:hover, ::before)
// - All rules with attribute selectors ([value="foo"])
//
// Rules with attribute selectors can also be inlined, but because the value
// may change dynamically, we consider those in both sets.


'use strict';
const selectorParser  = require('postcss-selector-parser');


// Input:  context with rules
// Output: context with only dynamic rules
module.exports = function selectDynamicRules(context) {
  const allRules      = context.rules;
  const dynamicRules  = allRules.map(toDynamicRule).filter(rule => rule);
  return context.set('rules', dynamicRules);
};


// Convert any rule into a dynamic rule, or null
//
// If a rule has multiple selectors, we pick only the selectors that make it
// dynamic.  If a rule has no dynamic selectors, we return null.
function toDynamicRule(rule) {
  // media query, font face, etc can only be applied when rendering
  if (rule.type === 'atrule')
    return rule;

  if (rule.type === 'rule') {
    const selectors = dynamicSelectors(rule);
    if (selectors.length)
      return rule.clone({ selectors });
  }

  // Ignore comments and anything else that's not a rule
  return null;
}


// Returns all dynamic selectors from the rule
function dynamicSelectors(rule) {
  return rule.selectors.filter(isDynamicSelector);
}


// Dynamic selector:
// - Pseudo element (e.g. ::before)
// - Pseudo selector (e.g. :hover)
// - Attribute selector (e.g. [value="foo"])
function isDynamicSelector(selector) {
  const result    = selectorParser().process(selector).res;
  const nodes     = result.nodes[0].nodes;
  const pseudo    = nodes.some(node => node.type === 'pseudo');
  const attribute = nodes.some(node => node.type === 'attribute');
  return pseudo || attribute;
}
