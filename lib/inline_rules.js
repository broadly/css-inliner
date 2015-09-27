// This stage inlines CSS rules into the document.  It modifies the DOM, but
// keeps the rules list intact.

'use strict';
const assert      = require('assert');
const ElementType = require('domelementtype');
const Immutable   = require('immutable');
const matchRule   = require('./match_rule');
const PostCSS     = require('postcss');
const precedence  = require('./precedence');
const toProperty  = require('./to_property');


// Input:   context with dom, rules
// Output:  context with mutated dom
module.exports = function inlineRules(context) {
  const dom      = context.dom;
  const rules    = context.rules;
  assert(dom, 'Expected context to contain dom property');
  assert(rules, 'Expected context to contain rules property');

  const onlyRules = rules.filter(rule => rule.type === 'rule');
  const matchers  = onlyRules.map(matchRule);
  applyRulesToNodes(dom.children, matchers);

  return context;
};


// Applies CSS rules (via matchers) recursively to a collection of nodes.
function applyRulesToNodes(nodes, matchers) {
  nodes.forEach(function(node) {
    if (isStylableElement(node))
      applyRulesToElement(node, matchers);
  });
}


// Is this node an element that can be styled?
function isStylableElement(node) {
  // This selects most elements, except <style> and <script>
  const isElement = (node.type === ElementType.Tag);
  // HTML <head> element is only thing that can't get styled
  const isHead    = (node.name === 'head');
  return isElement && !isHead;
}


// Apply CSS rules (via matchers) to a single element.  Mutates the element.
function applyRulesToElement(element, matchers) {
  const propertiesToInline = getPropertiesFromMatchers(element, matchers);
  if (propertiesToInline.size) {

    const existingProperties  = getPropertiesFromElement(element);
    const inlinedProperties   = propertiesToInline.reduce(addProperty, existingProperties);
    element.attribs.style     = getStyleAttribute(inlinedProperties);

  }
  applyRulesToNodes(element.children, matchers);
}


// Returns all the properties that apply to the given element, as reported by
// all the applicable matchers.
//
// (element, matchers) -> [ property ]
function getPropertiesFromMatchers(element, matchers) {
  const propertiesToInline = matchers
    .flatMap(match => match(element))
    .filter(properties => properties);
  return propertiesToInline;
}


// Parse element's style attribute and returns its properties as Map.
//
// (element) -> Map(name, property)
function getPropertiesFromElement(element) {
	const styleAttribute  = element.attribs.style;
  if (styleAttribute) {

    const decls       = PostCSS.parse(styleAttribute).nodes;
    const properties  = decls
      .map(decl => toProperty({ decl, specificity: '1000' }))
      .reduce(addProperty, Immutable.Map());
    return properties;

  } else
    return Immutable.Map();
}


// Add property to map.  If the property already exists, only apply if higher
// priority (important, specificity or last).  Returns the new map.
//
// (map, property) -> property
function addProperty(map, property) {
  const existing = map.get(property.name);
  const priority = precedence(existing, property);
  return map.set(priority.name, priority);
}


// Returns the value of the style attributes from a set of properties.
//
// Map(name, property) -> string
function getStyleAttribute(properties) {
  if (properties && properties.size) {
    const values = Array.from(properties.values());
    const pairs  = values.map(property => `${property.name}:${property.value}`);
    return pairs.join(';');
  } else
    return null;
}

