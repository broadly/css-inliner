// Filter dynamic rules: these rules must be included in the HTML document.
//
// Includes all media queries, font faces, rules with pseudo selectors, and
// rules with attribute selectors.

const selectorParser  = require('postcss-selector-parser');


// Input:  context with rules
// Output: context with only dynamic rules
module.exports = function onlyDynamicRules(context) {
  const allRules  = context.rules;
  const dynamic   = allRules.map(toDynamicRule).filter(rule => rule);
  return context.set('rules', dynamic);
};


// Convert any rule into a dynamic rule or null
//
// At rules (media query, font face) always returned, as they hold dynamic rules
//
// Rules with dynamic selectors (see isDynamicSelector) always returned, but
// only the dynamic selectors are
function toDynamicRule(rule) {
  if (rule.type === 'atrule')
    return rule;
  const dynamicSelectors = rule.selectors.filter(isDynamicSelector);
  if (dynamicSelectors.length)
    return rule.clone({ selectors: dynamicSelectors });
  else
    return null;
}


// Dynamic selector:
//
// Either a pseudo selector, which we cannot inline (e.g. :hover, ::before)
// Or an attribute selector, which may apply based on the state of an element
// (e.g. input field)
function isDynamicSelector(selector) {
  const result    = selectorParser().process(selector).res;
  const nodes     = result.nodes[0].nodes;
  const pseudo    = nodes.some(node => node.type === 'pseudo');
  const attribute = nodes.some(node => node.type === 'attribute');
  return pseudo || attribute;
}
