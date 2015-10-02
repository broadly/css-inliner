// Calculate specificity for selector.  Given a CSS selector, returns a
// three-digit string with value between "000" and "999".
//
// See http://www.w3.org/TR/selectors4/#specificity

'use strict';
const selectorParser  = require('postcss-selector-parser');


// selector -> specificity
//
// '#id'      -> '100'
// '.foo'     -> '010'
// 'div.foo'  -> '011'
module.exports = function calculateSpecificity(selector) {
  const parsed        = selectorParser().process(selector).res;
  const selectorNodes = parsed.nodes[0].nodes;

  const ids         = selectorNodes.filter(node => node.type === 'id').length;
  const classes     = selectorNodes.filter(node => node.type === 'class').length;
  const attributes  = selectorNodes.filter(node => node.type === 'attribute').length;
  const tags        = selectorNodes.filter(node => node.type === 'tag').length;

  const specificity = [ ids, classes + attributes, tags ];

  // [0, 1, 9] -> '019'
  // [0, 1, 10] -> '019'
  const asDigits = specificity
    .map(value => Math.min(9, value))
    .join('');

  return asDigits;
};

