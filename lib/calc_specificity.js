// Calculate specificity for selector.  Given a CSS selector, returns a
// three-digit string with value between "000" and "999".
//
// See http://www.w3.org/TR/selectors4/#specificity

const selectorParser  = require('postcss-selector-parser');


module.exports = function calculateSpecificity(selector) {
  const specificity = [0, 0, 0];

  selectorParser(function(nodes) {
    nodes.eachInside(function(node) {
      // We don't care about pseudo elements, since we don't inline those selectors
      if (node.type === 'id')
        ++specificity[0];
      else if (node.type === 'class' || node.type === 'attribute')
        ++specificity[1];
      else if (node.type === 'tag')
        ++specificity[2];
    });
  }).process(selector);

  // [0, 1, 9] -> '019'
  // [0, 1, 10] -> '019'
  const asDigits = specificity
    .map(value => Math.min(9, value))
    .join('');

  return asDigits;
};

