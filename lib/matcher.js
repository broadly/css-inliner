const CSSselect             = require('css-select');
const calculateSpecificity  = require('./calc_specificity');


module.exports = function matcher(rule, selector) {
  const match = CSSselect.compile(selector);

  const specificity   = calculateSpecificity(selector);
  const declarations  = rule.nodes.filter(node => node.type === 'decl');
  const properties    = declarations.map(function(decl) {
    const name        = decl.prop.trim();
    const value       = decl.value.trim();
    const important   = decl.important;
    const property    = { name, value, important, specificity };
    return property;
  });

  return function(element) {
    if (match(element))
      return properties;
  };
}
