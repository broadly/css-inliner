const DOMUtils = require('domutils');

// Input:  context with dom and compress
// Output: HTML source string
module.exports = function(context) {
  const dom  = context.dom;
  const html = DOMUtils.getOuterHTML(dom);
  return html;
};

