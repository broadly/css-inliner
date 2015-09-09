// selector -> integer
//
// Calculates specificity for selector, returning a value between 0 and 999.
//
// See http://www.w3.org/TR/selectors4/#specificity

const selectorParser  = require('postcss-selector-parser');


module.exports = function specificityFromSelector(selector) {
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
    .map(function(value) {
      return Math.min(9, value);
    })
    .join('');

  return asDigits;
}

