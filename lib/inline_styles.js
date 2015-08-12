// Dynamic and inlining styling for a document.
//
'use strict';
const DOMUtils        = require('domutils');
const ElementType     = require('domelementtype');


// { dom, inline, include } -> string
module.exports = function inlineStyles(result) {
  const dom     = result.dom;
  const include = result.include;

  addIncludedStyles(dom, include);
  const html = DOMUtils.getOuterHTML(dom);
  return html;
};


// Adds all included styled back into the DOM.  Modifies the DOM.
function addIncludedStyles(dom, include) {
  if (!include.length)
    return;

  const css = include
    .map(function(rule) {
      return rule.toString();
    })
    .join(';');

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

  const head = DOMUtils.getElementsByTagName('head', dom, true, 2);
  if (head.length)
    DOMUtils.appendChild(head[0], styleElement);
  else {
    const body = DOMUtils.getElementsByTagName('body', dom, true, 2);
    if (body.length)
      DOMUtils.appendChild(body[0], styleElement);
    else
      DOMUtils.appendChild(dom, styleElement);
  }
}

