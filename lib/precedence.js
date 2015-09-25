// Given two CSS properties, returns the highest precedence of the two.
//
// Each CSS property is an object with the properties:
//
// specificity - The specificity of the selector as a string (e.g. '100')
// important   - If the property has !important

'use strict';

module.exports = function precedence(a, b) {
  // If only one property exists, return that property
  if (a && !b)
    return a;
  else if (b && !a)
    return b;
  // If only one property is important, return that property
  else if (a.important && !b.important)
    return a;
  else if (b.important && !a.important)
    return b;
  // If one property has higher specificity, return that property
  else if (a.specificity > b.specificity)
    return a;
  // Return the later (second argument) property
  else
    return b;
};

