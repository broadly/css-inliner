// This stage converts dom back to HTML.

'use strict';
const assert      = require('assert');
const debug       = require('./debug');
const ElementType = require('domelementtype');
const Entities    = require('entities');
const Immutable   = require('immutable');


// Input:  context with dom
// Output: context with html property, no dom
module.exports = function domToHTML(context) {
  const dom     = context.dom;
  assert(dom, 'Expected context to contain dom property');

  debug('%s: Serializing DOM to HTML', context.filename);
  const stack   = Immutable.List([ dom ]);
  const html    = stringifyNodes(dom.children, stack);
  const result  = context.delete('dom').set('html', html);
  return result;
};


// -- Document --

// Matches doctype for XHTML.
const XHTML_DOCTYPE = /!DOCTYPE html .* XHTML/i;

// Stringify multiple nodes (the DOM or children of an element)
function stringifyNodes(nodes, stack) {
  const encoded = nodes.map(function(node, i) {

    if (ElementType.isTag(node))
      return stringifyElement(node, stack);
    else if (node.type === ElementType.Text)
      return stringifyText(node, stack);
    else if (node.type === ElementType.Directive) {
      const isDoctype = (i === 0);
      if (isDoctype && isXHTML(node))
        stack.get(0).isXHTML = true;
      return stringifyDirective(node);
    }

  });
  return encoded.filter(html => html).join('');
}


// Is this an XHTML document?
function isXHTML(doctype) {
  const directive = doctype.data;
  return XHTML_DOCTYPE.test(directive);
}


// Directive node to HTML directive
function stringifyDirective(node) {
  const directive = node.data;
  return `<${directive}>`;
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


// -- Elements --

// Void elements do not have any content, or closing tag
const VOID_ELEMENTS = Immutable.Set([
	'area',
	'base',
	'basefont',
	'br',
	'col',
	'command',
	'embed',
	'frame',
	'hr',
	'img',
	'input',
	'isindex',
	'keygen',
	'link',
	'meta',
	'param',
	'source',
	'track',
	'wbr'
]);


// The contents of these elements is not encoded
const UNENCODED_ELEMENTS = Immutable.Set([
  'style',
  'script',
  'xmp',
  'iframe',
  'noembed',
  'noframes',
  'plaintext',
  'noscript'
]);


// Stringify an element and all its children
function stringifyElement(element, stack) {
  const name        = element.name;
  const attributes  = stringifyAttributes(element.attribs);
  const openTag     = attributes ? `${name} ${attributes}` : name;

  const children    = element.children;
  const nextStack   = stack.push(element);
  const content     = stringifyNodes(children, nextStack);

  // In HTML5 SVG and MathML are "foreign elements", they have the same
  // production rules as XML, specifically empty elements can use self-closing
  // tags (smaller output)
  const isForeign     = !!nextStack.find(element => element.name === 'svg');
  // XML production rules apply to either XHTML documents or foreign elements
  // in HTML5 documents
  const isXML         = stack.get(0).isXHTML || isForeign;
  const isVoidElement = VOID_ELEMENTS.has(name);

  if (isXML) {
    // In XHTML void elements have an empty content model, and so should use
    // self-closing tags (which also parses as HTML), but elements with a
    // content model must use open and close tags, even if they have no content
    // (e.g. parsers choke on <title />)
    //
    // Foreign elements (SVG/MathML in HTML5) can deal with self-closing tags
    const isSelfClosing = isVoidElement || (isForeign && !content);
    return isSelfClosing ? `<${openTag} />` : `<${openTag}>${content}</${name}>`;
  } else
    // In HTML void elements have no content, only use a single tag (implied close)
    return isVoidElement ? `<${openTag}>` : `<${openTag}>${content}</${name}>`;
}


// Do we need to XML encode the content of the current element?
//
// True for most elements, except script, style, etc that were traditionally CDATA
function isContentEncoded(stack) {
  const parent        = stack.last();
  const shouldEncode  = !(UNENCODED_ELEMENTS.has(parent.name));
  return shouldEncode;
}


// -- Attributes --

// Boolean attributes, value not important, only presence of attribute
const BOOLEAN_ATTRIBUTES = Immutable.Set([
  'allowfullscreen',
  'async',
  'autofocus',
  'autoplay',
  'checked',
  'controls',
  'default',
  'defer',
  'disabled',
  'hidden',
  'ismap',
  'itemscope',
  'loop',
  'multiple',
  'muted',
  'open',
  'readonly',
  'required',
  'reversed',
  'scoped',
  'seamless',
  'selected',
  'typemustmatch'
]);


// Stringify all attributes
function stringifyAttributes(attributes) {
  const names = Object.getOwnPropertyNames(attributes);
  const pairs = names.map(name => stringifyAttribute(name, attributes[name]));
  return pairs.join(' ');
}


// Stringify single attribute value
function stringifyAttribute(name, value) {
  const isBoolean = BOOLEAN_ATTRIBUTES.has(name);
  if (isBoolean)
    return name;
  else {
    // We enclose attribute values in double quotes, so we don't need to escape
    // single quotes; if CSS properties use single quotes, we get the smallest
    // output.
    const encoded = Entities.encodeXML(value).replace(/&apos;/g, '\'');
    return `${name}="${encoded}"`;
  }
}

