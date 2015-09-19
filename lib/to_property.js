// PostCSS declaration to CSS property.  We add specificity, so we apply
// property with the higher specificity.

const Immutable = require('immutable');


const Property = Immutable.Record({ name: null, value: null, important: false, specificity: '000' });

module.exports = function propertyFromDeclaration(params) {
  const decl        = params.decl;
  const specificity = params.specificity;
  const name        = decl.prop.trim();
  const value       = decl.value.trim();
  const important   = !!decl.important;
  return new Property({ name, value, important, specificity });
};

