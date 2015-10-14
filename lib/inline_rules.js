// This stage inlines CSS rules into the document.  It modifies the DOM, but
// keeps the rules list intact.

'use strict';
const assert        = require('assert');
const debug         = require('./debug');
const ElementType   = require('domelementtype');
const Immutable     = require('immutable');
const matchRule     = require('./match_rule');
const PostCSS       = require('postcss');
const precedence    = require('./precedence');
const TemplateTags  = require('./template_tags');
const toProperty    = require('./to_property');


// Input:   context with dom, rules
// Output:  context with mutated dom
module.exports = function inlineRules(context) {
  const dom      = context.dom;
  const rules    = context.rules;
  assert(dom,   'Expected context to contain dom property');
  assert(rules, 'Expected context to contain rules property');

  const onlyRules = rules.filter(rule => rule.type === 'rule');
  const matchers  = onlyRules.map(matchRule);
  debug('%s: Inlining %d CSS rules with %d matchers', context.filename, rules.size, matchers.size);
  applyRulesToNodes(context, dom.children, matchers);

  return context;
};


// Applies CSS rules (via matchers) recursively to a collection of nodes.
function applyRulesToNodes(context, nodes, matchers) {
  nodes.forEach(function(node) {
    if (isStylableElement(node))
      applyRulesToElement(context, node, matchers);
  });
}


// Is this node an element that can be styled?
function isStylableElement(node) {
  // This selects most elements, except <style> and <script>, which as not styleable
  const isStandardElement = (node.type === ElementType.Tag);
  // HTML <head> element is only thing that can't get styled
  const isHeadElement    = (node.name === 'head');
  return isStandardElement && !isHeadElement;
}


// Apply CSS rules (via matchers) to a single element.  Mutates the element.
function applyRulesToElement(context, element, matchers) {
  checkClassAttribute(context, element);

  const propertiesToInline = getPropertiesFromMatchers(element, matchers);
  if (propertiesToInline.size > 0) {

    const existingProperties  = getPropertiesFromElement(element);
    const inlinedProperties   = propertiesToInline.reduce(addProperty, existingProperties);
    element.attribs.style     = getStyleAttribute(inlinedProperties);

  }
  applyRulesToNodes(context, element.children, matchers);
}


// Check that class attribute is not using a template tag: these class names
// cannot be inlined, only resolved when rendering.  Potentially an issue, so
// worth a warning.
function checkClassAttribute(context, element) {
  const classNames    = (element.attribs.class || '').split(/\s+/);
  const hasTagMarker  = classNames.some(TemplateTags.isTagMarker);
  if (hasTagMarker) {

    const inliner   = context.inliner;
    const filename  = context.filename;
    const warning   = `${filename}: One of the elements is using template tag for its class name`;
    inliner.emit('warning', warning);

  }
}


// Returns all the properties that apply to the given element, as reported by
// all the applicable matchers.
//
// (element, matchers) -> [ property ]
function getPropertiesFromMatchers(element, matchers) {
  const propertiesToInline = matchers
    .flatMap(match => match(element));
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
      .map(decl => toProperty('1000', decl))
      .reduce(addProperty, Immutable.OrderedMap());
    return properties;

  } else
    return Immutable.OrderedMap();
}


// Add property to map.  If the property already exists, only apply if higher
// priority (important, specificity or last).  Returns the new map.
//
// (map, property) -> property
function addProperty(map, newProperty) {
  const existingProperty  = map.get(newProperty.name);
  const higherSpecificity = precedence(existingProperty, newProperty);
  return map.set(higherSpecificity.name, higherSpecificity);
}


// Returns the value of the style attributes from a set of properties.
//
// Map(name, property) -> string
function getStyleAttribute(properties) {
  if (properties.size > 0) {
    const values = Immutable.List(properties.values());
    const pairs  = values.map(property => `${property.name}:${property.value}`);
    return pairs.join(';');
  } else
    return null;
}

