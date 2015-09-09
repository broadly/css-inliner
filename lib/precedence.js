// Given two declarations, returns the highest precedence of the two.
//
// Each declaration is an object with the properties:
// specificity - The specificity of the selector as a string (e.g. '100')
// important   - If the declaration has !important
//
// If only one declaration exists, return that one.
// If only one declaration is important, return that one.
// If one declaration has the higher specificity, return that one.
// Otherwise, return the second (latest) declaration.

module.exports = function precedence(a, b) {
  if (a && !b)
    return a;
  if (b && !a)
    return b;
  if (a.important && !b.important)
    return a;
  if (b.important && !a.important)
    return b;
  if (a.specificity > b.specificity)
    return a;
  return b;
}
