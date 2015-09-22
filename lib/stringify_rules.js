// Convert PostCSS rules back into CSS.
//
// PostCSS toString preserves comments and whitespaces.  We include the option
// to compress the results.

module.exports = stringifyRules;


// Call with a list of rules, and whether or not we want to compress the CSS.
function stringifyRules(rules, compress) {
  const css = compress ?
    rules.map(stringifyRule).join('') :
    rules.map(rule => rule.toString()).join('\n');
  return css;
}


// PostCSS rule -> string
//
// PostCSS rules have a toString() method but it preserves all the whitespace,
// which we want to strip out so we can output smaller files.
function stringifyRule(rule) {
  switch (rule.type) {
    case 'atrule': {
      const childRules = stringifyRules(rule.nodes, true);
      return `@${rule.name} ${rule.params}{${childRules}}`;
    }
    case 'rule': {
      const selectors     = rule.selectors.map(stringifySelector).join(',');
      const declarations  = rule.nodes.map(stringifyDeclaration).join(';');
      return `${selectors}{${declarations}}`;
    }
    default: // ignore comments and such
      return '';
  }
}


// string -> string
function stringifySelector(selector) {
  return selector.trim();
}


// PostCSS declaration -> string
function stringifyDeclaration(decl) {
  const name      = decl.prop.trim();
  const value     = decl.value.trim();
  const important = decl.important ? ' !important' : '';
  return `${name}:${value}${important}`;
}

