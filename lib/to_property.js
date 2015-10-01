// Converts a PostCSS declaration into our preferred structure for a CSS property.
//
// Our structure is immutable, and also includes the property's specificity, so
// we can easily choose from two properties based on precedence (see there).

'use strict';
const Immutable = require('immutable');


const Property = Immutable.Record({ name: null, value: null, important: false, specificity: '000' });

// { decl, specificity } -> { name, value, important, specificity }
module.exports = function toProperty(params) {
  const decl        = params.decl;
  const specificity = params.specificity;

  const name        = decl.prop.trim();
  const value       = decl.value ? decl.value.trim() : null;
  const important   = !!decl.important;

  return new Property({ name, value, important, specificity });
};

