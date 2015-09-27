// This stage parses HTML into htmlparser2 DOM.

'use strict';
const assert      = require('assert');
const htmlparser2 = require('@broadly/htmlparser2');


// Input:   context with html property
// Output:  context with dom property, no html
module.exports = function parseHTML(context) {
  const html = context.html;
  assert(html, 'Expected context to contain html property');

  const nodes = htmlparser2.parseDOM(html, {
    decodeEntities:           true,
    lowerCaseAttributeNames:  true,
    lowerCaseTags:            true,
    recognizeSelfClosing:     true,
    xmlMode:                  false
  });
  const dom  = {
    type:     'root',
    children: nodes
  };
  for (let node of nodes)
    node.parent = dom;

  const result  = context.delete('html').set('dom', dom);
  return result;
};

