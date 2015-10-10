// Convert PostCSS rules back into CSS text.

'use strict';


module.exports = stringifyAllRules;

// PostCSS rules -> string
//
// Since rules may contain other rules (e.g. media queries) this is recursive by
// means of stringifyRule
function stringifyAllRules(rules) {
  const css = rules.map(stringifyRule).join('');
  return css;
}


// PostCSS rule -> string
//
// PostCSS rules have a toString() method but it preserves all the whitespace,
// which we want to strip out so we can output smaller files.
function stringifyRule(rule) {
  switch (rule.type) {
    case 'atrule': {
      if (rule.nodes) {
        const atRuleBody  = stringifyAllRules(rule.nodes);
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

