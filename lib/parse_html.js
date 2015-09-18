// Parse HTML to htmlparser2 DOM.

'use strict';
const htmlparser2   = require('@broadly/htmlparser2');

module.exports = function parseHTML(html) {
  const dom   = htmlparser2.parseDOM(html, {
    decodeEntities:           true,
    lowerCaseAttributeNames:  true,
    lowerCaseTags:            true,
    recognizeSelfClosing:     true,
    xmlMode:                  false
  });
  return dom;
};

