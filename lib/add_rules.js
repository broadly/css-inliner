// This stage adds CSS rules back into the document, by creating a <style>
// element and inserting it at the top of the <head> element (or <body> or top
// of document).


'use strict';
const assert          = require('assert');
const DOMUtils        = require('domutils');
const ElementType     = require('domelementtype');
const stringifyRules  = require('./stringify_rules');
const debug           = require('./debug');


// Input:  context has dom and rules
// Output: context has mutated dom, removed all rules
module.exports = function addRules(context) {
  const dom       = context.dom;
  const rules     = context.rules;
  assert(dom,   'Expected context to contain dom property');
  assert(rules, 'Expected context to contain rules property');

  if (rules.size > 0) {
    debug('%s: Adding <style> element to document', context.filename);
    const styleElement  = rulesToStyleElement(rules);
    insertStyleElement(dom, styleElement);
  }

  const result = context.delete('rules');
  return result;
};


// Returns the <style> element with all remaining rules
function rulesToStyleElement(rules) {
  const css           = stringifyRules(rules);
  const textNode      = {
    type: ElementType.Text,
    data: css
  };
  const styleElement  = {
    type:     ElementType.Style,
    name:     'style',
    attribs:  {},
    children: []
  };
  DOMUtils.appendChild(styleElement, textNode);
  return styleElement;
}


// Inserts <style> element into the DOM
function insertStyleElement(dom, styleElement) {
  const parent = headElement(dom) || bodyElement(dom) || dom;
  prependElement(parent, styleElement);
}


function headElement(dom) {
  return DOMUtils.getElementsByTagName('head', dom, true, 2)[0];
}

function bodyElement(dom) {
  return DOMUtils.getElementsByTagName('body', dom, true, 2)[0];
}


// Insert element as first child of parent.
//
// Parent may be another element (head, body) or an array of elements
// (htmlparse2 dom)
function prependElement(parent, element) {
  if (parent.children)
    DOMUtils.prepend(parent.children[0], element);
  else
    DOMUtils.appendChild(parent, element);
}

