// Append rules to DOM.

const DOMUtils        = require('domutils');
const ElementType     = require('domelementtype');
const stringifyRules  = require('./stringify_rules');


// Appends rules to DOM.  Mutates the DOM.
//
// Input:   context has dom, rules and compress
// Output:  context has mutated dom, removed any rules
module.exports = function appendRules(context) {
  const dom       = context.dom;
  const rules     = context.rules;
  const compress  = context.compress;

  if (rules && rules.size) {

    const css = stringifyRules(rules, compress);
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

  }
  return context.delete('rules');
};

