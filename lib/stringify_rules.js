// Convert PostCSS rules back into CSS text.
//
// PostCSS has a toString() method, but it preserves comments and whitespace,
// and we have an option to compress the output by stripping unnecesssary junk.

'use strict';


// Call with a list of rules, and whether or not we want to compress the CSS.
module.exports = function stringifyRules(rules, compress) {
  const css = compress ?
    stringifyAndCompress(rules) :
    stringifyDontCompress(rules);
  return css;
};


// PostCSS rules -> string
//
// Since rules may contain other rules (e.g. media queries) this is recursive by
// means of stringifyRule
function stringifyAndCompress(rules) {
  return rules.map(stringifyRule).join('');
}


// PostCSS rules -> string
function stringifyDontCompress(rules) {
  return rules.map(rule => rule.toString()).join('\n');
}


// PostCSS rule -> string
//
// PostCSS rules have a toString() method but it preserves all the whitespace,
// which we want to strip out so we can output smaller files.
function stringifyRule(rule) {
  switch (rule.type) {
    case 'atrule': {
      if (rule.nodes) {
        const atRuleBody  = stringifyAndCompress(rule.nodes);
        return `@${rule.name} ${rule.params}{${atRuleBody}}`;
      } else
        return `@${rule.name} ${rule.params};`;
    }
    case 'rule': {
      const selectors     = stringifySelectors(rule);
      const declarations  = stringifyDeclarations(rule);
      return `${selectors}{${declarations}}`;
    }
    default: // ignore comments and such
      return '';
  }
}


// PostCSS rule -> string
function stringifySelectors(rule) {
  return rule.selectors.map(selector => selector.trim()).join(',');
}


// PostCSS rule -> string
function stringifyDeclarations(rule) {
  return rule.nodes.map(stringifyDeclaration).join(';');
}


// PostCSS declaration -> string
function stringifyDeclaration(decl) {
  const name      = decl.prop.trim();
  const value     = decl.value.trim();
  const important = decl.important ? ' !important' : '';
  return `${name}:${value}${important}`;
}

