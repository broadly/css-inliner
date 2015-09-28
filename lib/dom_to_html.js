// This stage converts dom back to HTML.

'use strict';
const assert      = require('assert');
const ElementType = require('domelementtype');
const Entities    = require('entities');


// Input:  context with dom
// Output: context with html property, no dom
module.exports = function domToHTML(context) {
  const dom     = context.dom;
  assert(dom, 'Expected context to contain dom property');

  const html    = stringify(dom.children, []);
  const result  = context.delete('dom').set('html', html);
  return result;
};


// Stringify multiple nodes (the DOM or children of an element)
function stringify(nodes, stack) {
  const encoded = nodes.map(function(node) {

    if (ElementType.isTag(node))
      return stringifyElement(node, stack);
    else if (node.type === ElementType.Text)
      return stringifyText(node, stack);
    else if (node.type === ElementType.Directive)
      return stringifyDirective(node);

  });
  return encoded.filter(html => html).join('');
}


// -- Elements --

// Void elements do not have any content, or closing tag
const VOID_ELEMENTS = {
	area:       true,
	base:       true,
	basefont:   true,
	br:         true,
	col:        true,
	command:    true,
	embed:      true,
	frame:      true,
	hr:         true,
	img:        true,
	input:      true,
	isindex:    true,
	keygen:     true,
	link:       true,
	meta:       true,
	param:      true,
	source:     true,
	track:      true,
	wbr:        true
};


// The contents of these elements is not encoded
const UNENCODED_ELEMENTS = {
  style:      true,
  script:     true,
  xmp:        true,
  iframe:     true,
  noembed:    true,
  noframes:   true,
  plaintext:  true,
  noscript:   true
};


// Stringify an element and all its children
function stringifyElement(element, stack) {
  const name        = element.name;
  const attributes  = stringifyAttributes(element.attribs);
  const open        = attributes ? `${name} ${attributes}` : name;

  const children    = element.children;
  const nextStack   = stack.concat(element);
  const content     = stringify(children, nextStack);

  const isXML       = ~nextStack.findIndex(element => element.name === 'svg');

  if (isXML) {
    const selfClosing   = !content;
    return selfClosing ? `<${open}/>` : `<${open}>${content}</${name}>`;
  } else {
    const voidElement = (name in VOID_ELEMENTS);
    return voidElement ? `<${open}>` : `<${open}>${content}</${name}>`;
  }
}


// Do we need to XML encode the content of the current element?
function isContentEncoded(stack) {
  const parent = stack[stack.length - 1];
  const encode = !(parent && parent.name in UNENCODED_ELEMENTS);
  return encode;
}


// -- Attributes --

// Boolean attributes, value not important, only presence of attribute
const BOOLEAN_ATTRIBUTES = {
  allowfullscreen:  true,
  async:            true,
  autofocus:        true,
  autoplay:         true,
  checked:          true,
  controls:         true,
  default:          true,
  defer:            true,
  disabled:         true,
  hidden:           true,
  ismap:            true,
  loop:             true,
  multiple:         true,
  muted:            true,
  open:             true,
  readonly:         true,
  required:         true,
  reversed:         true,
  scoped:           true,
  seamless:         true,
  selected:         true,
  typemustmatch:    true
};


// Stringify all attributes
function stringifyAttributes(attributes) {
  const names = Object.getOwnPropertyNames(attributes);
  const pairs = names.map(name => stringifyAttribute(name, attributes[name]));
  return pairs.join(' ');
}


// Stringify single attribute value
function stringifyAttribute(name, value) {
  const isBoolean = (name in BOOLEAN_ATTRIBUTES);
  // We enclose attribute values in double quotes, so we don't need to escape
  // single quotes; if CSS properties use single quotes, we get the smallest
  // output.
  const encoded   = Entities.encodeXML(value).replace(/&apos;/g, '\'');
  return isBoolean ? name : `${name}="${encoded}"`;
}


// -- Everything else --

// Directive node to HTML directive
function stringifyDirective(node) {
  const data = node.data;
  return `<${data}>`;
}

// Text node to encoded HTML
//
// Need the stack since some element content is not encoded (e.g. style and
// script elements)
function stringifyText(node, stack) {
  const text          = node.data || '';
  // encodeHTML encodes things like semicolons
  const maybeEncoded  = isContentEncoded(stack) ? Entities.encodeXML(text) : text;
  return maybeEncoded;
}

