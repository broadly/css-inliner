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

  for (let selector of rule.selectors)
    if (canApplyInline(selector))
      inline.push(selector);
    else
      include.push(selector);

  return {
    include:  include.length ? rule.clone({ selectors: include }) : null,
    inline:   inline.length  ? rule.clone({ selectors: inline })  : null
  };
}


// Returns true if the selector can be applied to inline element.  Pseudo
// selectors, media queries, etc cannot be used to inline.
function canApplyInline(selector) {
  let pseudo = false;

  selectorParser(function(nodes) {
    nodes.eachInside(function(node) {
      if (node.type === 'pseudo')
        pseudo = true;
    });
  }).process(selector);

  return !pseudo;
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


// selector -> [ a, b, c ]
function specificityFromSelector(selector) {
  const specificity = [0, 0, 0];

  selectorParser(function(nodes) {
    nodes.eachInside(function(node) {
      if (node.type === 'id')
        ++specificity[0];
      if (node.type === 'class')
        ++specificity[1];
    });
  }).process(selector);

  return specificity;
}



// -- Apply rules (inline) --

function applyRulesRecursively(nodes, matchers) {
  for (let node of nodes) {
    const isElement = (node.type === ElementType.Tag);
    const isHead    = (isElement && node.name === 'head');

    if (isElement && !isHead) {
      applyRulesToElement(node, matchers);
      applyRulesRecursively(node.children, matchers);
    }
  }
}


function applyRulesToElement(element, matchers) {
	const properties = parseStyleFromElement(element);
  addMatchingRules(element, matchers, properties);

  const styles = [];
  for (let property of properties.values())
    styles.push( property.toString() );
  if (styles.length)
    element.attribs.style = styles.join(';');
}


function parseStyleFromElement(element) {
	const style = element.attribs.style;
	if (!style)
		return new Map();

  const properties = new Map();
  const decls = postcss.parse(style).nodes;
  for (let decl of decls) {
    const name = decl.prop.trim();
    properties.set(name, decl);
  }

  return properties;
}


function addMatchingRules(element, matchers, properties) {
  for (let matcher of matchers) {
    let match = matcher(element);
    if (match)
      addPropertiesFromRule(element, match.rule, properties);
  }
}


function addPropertiesFromRule(element, rule, properties) {
  rule.eachDecl(function(decl) {
    const name     = decl.prop.trim();
    const existing = properties.get(name);
    if (!existing || override(existing, decl)) {
      const clone = decl.clone();
      clone.important = false;
      properties.set(name, clone);
    }
  });
}


function override(existing, decl) {
  return decl.important && !existing.important;
}

