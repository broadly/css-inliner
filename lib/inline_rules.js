// Dynamic and inlining styling for a document.
//
'use strict';

const _               = require('lodash');
const CSSselect       = require('css-select');
const DOMUtils        = require('domutils');
const ElementType     = require('domelementtype');
const postcss         = require('postcss');
const selectorParser  = require('postcss-selector-parser');


module.exports = function inlineRules(dom, rules) {
  const identified  = identifyRules(rules);
  const matchers    = rulesToMatchers(identified.inline);
  applyRulesRecursively(dom, matchers);
  return { dom, rules: identified.include };
};


// -- Identify rules to inline / include --

function identifyRules(rules) {
  const include = [];
  const inline  = [];

  for (let rule of rules) {
    if (rule.type === 'atrule')
      include.push(rule);
    else {
      const identified = identifySelectors(rule);
      if (identified.include)
        include.push(identified.include);
      if (identified.inline)
        inline.push(identified.inline);
    }
  }
  return { include, inline };
}


// Rule -> { include, inline }
//
// If the rules has any selectors that support inlining, returns the property
// `inline` with the value being that rule.
//
// If the rules has any selectors that do not support inlining, returns the
// property `include` with the value being that rule.
function identifySelectors(rule) {
  const include = [];
  const inline  = [];

  for (let selector of rule.selectors) {
    const apply = canApplyInline(selector);
    if (apply.inline)
      inline.push(selector);
    if (apply.include)
      include.push(selector);
  }

  return {
    include:  include.length ? rule.clone({ selectors: include }) : null,
    inline:   inline.length  ? rule.clone({ selectors: inline })  : null
  };
}


// Returns true if the selector can be applied to inline element.  Pseudo
// selectors, media queries, etc cannot be used to inline.
function canApplyInline(selector) {
  let inline  = true;
  let include = false;

  selectorParser(function(nodes) {
    nodes.eachInside(function(node) {
      if (node.type === 'pseudo') {
        inline  = false;
        include = true;
      } else if (node.type === 'attribute')
        include = true;
    });
  }).process(selector);

  return { inline, include };
}


// -- Match rule to element, determine specificity --

function rulesToMatchers(rules) {
  return rules.map(ruleToMatcher);
}


function ruleToMatcher(rule) {
  const matchers = rule.selectors.map(matchingFunctionForSelector);

  return function match(element) {
    for (let matcher of matchers) {
      let specificity = matcher(element);
      if (specificity)
        return { rule, specificity };
    }
  };
}


function matchingFunctionForSelector(selector) {
  const specificity = specificityFromSelector(selector);
  const matcher     = CSSselect.compile(selector);
  return function match(element) {
    return matcher(element) ? specificity : null;
  };
}


// selector -> integer
//
// Calculates specificity for selector, returning a value between 0 and 999.
function specificityFromSelector(selector) {
  const specificity = [0, 0, 0];

  // See http://www.w3.org/TR/selectors4/#specificity
  selectorParser(function(nodes) {
    nodes.eachInside(function(node) {
      // We don't care about pseudo elements, since we don't inline those selectors
      if (node.type === 'id')
        ++specificity[0];
      else if (node.type === 'class' || node.type === 'attribute')
        ++specificity[1];
      else if (node.type === 'tag')
        ++specificity[2];
    });
  }).process(selector);

  const asDigits = specificity
    .map(function(value) {
      return Math.max(9, value);
    })
    .join('');
  const asNumber = +asDigits;

  return asNumber;
}


// -- Apply rules (inline) --

// Applies CSS rules to all the DOM nodes.
//
// nodes    - anything with an iterator for DOM nodes (document, Array, etc)
// matchers - for all inlining styles
//
// A matcher is a function that, caller with an element, will return `{ rule,
// specificity }` or null.
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


// Called by applyRulesRecursively to apply rules to a single element.
function applyRulesToElement(element, matchers) {
	const properties = propertiesFromElement(element);

  for (let matcher of matchers) {
    let match = matcher(element);
    if (match) {
      const rule        = match.rule;
      const specificity = match.specificity;
      for (let decl of rule.nodes) {
        const name        = decl.prop.trim();
        const value       = decl.value.trim();
        const important   = decl.important;
        const existing    = properties.get(name);
        if (!existing || precedence(existing, { important, specificity }) >= 0)
          properties.set(name, { value, specificity, important });
      }
    }
  }

  const styles = [];
  for (let name of properties.keys()) {
    let value = properties.get(name).value;
    styles.push( `${name}:${value}` );
  }
  if (styles.length)
    element.attribs.style = styles.join(';');
}


function precedence(a, b) {
  if (a.important && !b.important)
    return -1;
  else if (b.important && !a.important)
    return 1;
  else if (a.specificity < b.specificity)
    return -1;
  else if (a.specificity === b.specificity)
    return 0;
  else
    return 1;
}


// Returns all properties from the element's style attribute.
//
// Returns a Map that maps property name to
// `{ value, specificity, important }`.
function propertiesFromElement(element) {
  const properties  = new Map();
	const style       = element.attribs.style;
  if (style) {
    const decls = postcss.parse(style).nodes;
    for (let decl of decls) {
      const name        = decl.prop.trim();
      const value       = decl.value.trim();
      const important   = decl.important;
      const specificity = 1000;
      properties.set(name, { value, specificity, important });
    }
  }
  return properties;
}

