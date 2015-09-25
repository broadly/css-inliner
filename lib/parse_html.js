// This stage parses HTML into htmlparser2 DOM.

'use strict';
const assert      = require('assert');
const htmlparser2 = require('@broadly/htmlparser2');


// Input:   context with html property
// Output:  context with dom property, no html
module.exports = function parseHTML(context) {
  const html = context.html;
  assert(html, 'Expected context to contain html property');

  const dom   = htmlparser2.parseDOM(html, {
    decodeEntities:           true,
    lowerCaseAttributeNames:  true,
    lowerCaseTags:            true,
    recognizeSelfClosing:     true,
    xmlMode:                  false
  });

  const result  = context.delete('html').set('dom', dom);
  return result;
};

