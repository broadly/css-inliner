// Calculate specificity for selector.  Given a CSS selector, returns a
// three-digit string with value between "000" and "999".
//
// See http://www.w3.org/TR/selectors4/#specificity

const selectorParser  = require('postcss-selector-parser');


// selector -> specificity
//
// '#id'      -> '100'
// '.foo'     -> '010'
// 'div.foo'  -> '011'
module.exports = function calculateSpecificity(selector) {
  const result      = selectorParser().process(selector).res;
  const nodes       = result.nodes[0].nodes;

  const ids         = nodes.filter(node => node.type === 'id');
  const classes     = nodes.filter(node => node.type === 'class');
  const attributes  = nodes.filter(node => node.type === 'attribute');
  const tags        = nodes.filter(node => node.type === 'tag');

  const specificity = [
    ids.length,
    classes.length + attributes.length,
    tags.length
  ];

  // [0, 1, 9] -> '019'
  // [0, 1, 10] -> '019'
  const asDigits = specificity
    .map(value => Math.min(9, value))
    .join('');

  return asDigits;
};

