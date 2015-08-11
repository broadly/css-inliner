// Parse HTML document.

'use strict';
const htmlparser2  = require('htmlparser2');


// promise(string) -> promise(dom)
//
// Parse HTML document, resolves to htmlparser2 DOM.
module.exports = function parseHTMLAsync(htmlPromise) {
  return Promise.resolve(htmlPromise)
    .then(function(html) {

      const dom = htmlparser2.parseDOM(html, {
        decodeEntities:           true,
        lowerCaseAttributeNames:  true,
        lowerCaseTags:            true,
        recognizeSelfClosing:     true,
        xmlMode:                  false
      });
      return dom;

    });
};

