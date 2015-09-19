// Append rules to DOM.

const DOMUtils    = require('domutils');
const ElementType = require('domelementtype');


// Appends rules to DOM.  Mutates the DOM.
//
// (dom, List(rules))
module.exports = function appendRules(dom, rules) {
  if (!rules || !rules.size)
    return;

  const css = rules.map(stringifyRule).join('');
  const styleElement  = {
    type:     ElementType.Style,
    name:     'style',
    attribs:  {},
    children: []
  };
  DOMUtils.appendChild(styleElement, {
    type: ElementType.Text,
    data: css
  });

  const head = DOMUtils.getElementsByTagName('head', dom, true, 2)[0];
  if (head)
    if (head.children)
      DOMUtils.prepend(head.children[0], styleElement);
    else
      DOMUtils.appendChild(head, styleElement);
  else {
    const body = DOMUtils.getElementsByTagName('body', dom, true, 2)[0];
    if (body)
      if (body.children)
        DOMUtils.prepend(body.children[0], styleElement);
      else
        DOMUtils.appendChild(body, styleElement);
    else
      dom.unshift(styleElement);
  }
};


// PostCSS rule -> string
//
// PostCSS rules have a toString() method but it preserves all the whitespace,
// which we want to strip out so we can output smaller files.
function stringifyRule(rule) {
  if (rule.type === 'atrule') {
    const rules = rule.nodes.map(stringifyRule).join('');
    return `@${rule.name} ${rule.params}{${rules}}`;
  } else {
    const selectors     = rule.selectors.map(stringifySelector).join(',');
    const declarations  = rule.nodes.map(stringifyDeclaration).join(';');
    return `${selectors}{${declarations}}`;
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

