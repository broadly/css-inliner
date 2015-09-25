// This stage converts dom back to HTML.

'use strict';
const DOMUtils = require('domutils');


// Input:  context with dom
// Output: context with html property, no dom
module.exports = function(context) {
  const dom     = context.dom;
  const html    = DOMUtils.getOuterHTML(dom);
  const result  = context.delete('dom').set('html', html);
  return result;
};

