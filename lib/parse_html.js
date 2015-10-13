// This stage parses HTML into htmlparser2 DOM.

'use strict';
const assert      = require('assert');
const debug       = require('./debug');
const htmlparser2 = require('@broadly/htmlparser2');


const PARSE_OPTIONS = {
  // We need to decode entities (e.g. &quot; => ") so we can encode them again
  // when we serialize DOM to HTML
  decodeEntities:           true,
  // Lower case all the things makes the code simpler, and is HTML5 correct
  lowerCaseAttributeNames:  true,
  lowerCaseTags:            true,
  // We parse the input as HTML5, so tolerant of some XHTML constructs like <br/>
  recognizeSelfClosing:     true,
  xmlMode:                  false
};


// Input:   context with html property
// Output:  context with dom property, no html
module.exports = function parseHTML(context) {
  const html    = context.html;
  assert(html, 'Expected context to contain html property');

  debug('%s: Parsing HTML tags', context.filename);
  const nodes   = htmlparser2.parseDOM(html, PARSE_OPTIONS);
  const dom     = createRootNode(nodes);

  const result  = context.delete('html').set('dom', dom);
  return result;
};


// htmlparser2 returns an array of node.  To perform some of the tasks (e.g.
// remove <style> element) we need to have a root node above all these nodes.
// This array creates and returns a new root node.
//
// [ node ] -> node
function createRootNode(nodes) {
  const root  = {
    type:     'root',
    attribs:  {},
    children: nodes
  };
  for (let node of nodes)
    node.parent = root;
  return root;
}

