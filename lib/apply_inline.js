// Apply inline CSS rules to DOM.

'use strict';
const ElementType = require('domelementtype');
const Immutable   = require('immutable');
const PostCSS     = require('postcss');
const precedence  = require('./precedence');
const matchRule   = require('./match_rule');


// Given a DOM and set of rules, apply rules to the DOM and mutates it.
module.exports = function applyInline(dom, rules) {
  const nodes       = Array.isArray(dom) ? dom : [ dom ];
  const matchers    = rules.map(matchRule);
  applyRulesRecursively(nodes, matchers);
};


// Applies CSS rules (via matchers) recursively to a collection of nodes.
// Mutates the DOM.
function applyRulesRecursively(nodes, matchers) {
  for (let node of nodes) {
    const isElement = (node.type === ElementType.Tag);
    // HTML <head> element is only thing that can't get styled
    const isHead    = (isElement && node.name === 'head');

    if (isElement && !isHead) {
      applyRulesToElement(node, matchers);
      applyRulesRecursively(node.children, matchers);
    }
  }
}


// Apply CSS rules (via matchers) to a single element.  Mutates the element.
function applyRulesToElement(element, matchers) {
  const propertiesToInline = propertiesFromMatchers(element, matchers);
  if (propertiesToInline.size) {

    const existingProperties  = propertiesFromElement(element);
    const inlinedProperties   = propertiesToInline.reduce(addPropertyToMap, existingProperties);
    element.attribs.style     = propertiesToStyleAttribute(inlinedProperties);

  }
}


// Returns all the properties that apply to the given element, as reported by
// all the applicable matchers.
//
// (element, matchers) -> [ property ]
function propertiesFromMatchers(element, matchers) {
  const propertiesToInline = matchers
    .flatMap(match => match(element))
    .filter(properties => properties);
  return propertiesToInline;
}


// Parse element's style attribute and returns its properties as Map.
//
// (element) -> Map(name, property)
function propertiesFromElement(element) {
	const styleAttribute  = element.attribs.style;
  if (styleAttribute) {
    const decls       = PostCSS.parse(styleAttribute).nodes;
    const properties  = decls
      .map(inlineDeclarationToProperty)
      .reduce(addPropertyToMap, Immutable.Map());
    return properties;
  } else
    return Immutable.Map();
}


// Convert PostCSS declaration for inline style into our property object
// literal.
//
// (decl) -> ({ name, value, important, specificity })
function inlineDeclarationToProperty(decl) {
  const name        = decl.prop.trim();
  const value       = decl.value.trim();
  const important   = decl.important;
  const specificity = '1000';
  const property    = { name, value, important, specificity };
  Object.freeze(property);
  return property;
}


// Add property to map.  If the property already exists, only apply if higher
// priority (important, specificity or last).  Returns the new map.
//
// (map, property) -> property
function addPropertyToMap(map, property) {
  const existing = map.get(property.name);
  const priority = precedence(existing, property);
  return map.set(priority.name, priority);
}


// Returns the value of the style attributes from a set of properties.
//
// Map(name, property) -> string
function propertiesToStyleAttribute(properties) {
  if (properties && properties.size) {
    const values = Array.from(properties.values());
    const pairs  = values.map(property => `${property.name}:${property.value}`);
    return pairs.join(';');
  } else
    return null;
}

