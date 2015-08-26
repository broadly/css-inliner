
// inlineAsync(html) -> promise(html)
//   Inline CSS in the HTML document.
//
// criticalAsync(html) -> promise(html)
//   Apply critical path CSS to the HTML document.


'use strict';
const name = require('../package.json').name;

const _             = require('lodash');
const Cache         = require('./cache');
const debug         = require('debug')(name);
const DOMUtils      = require('domutils');
const ElementType   = require('domelementtype');
const extractRules  = require('./extract_rules');
const htmlparser2   = require('@broadly/htmlparser2');
const inlineRules   = require('./inline_rules');
const Path          = require('path');


module.exports = class CSSInliner {

  // Construct a new CSS inliner.
  constructor(options) {
    options = options || {};
    this._cache   = new Cache(options.plugins);
    this._resolve = options.resolve || CSSInliner.fileResolver(options.directory);
  }


  // Returns a file resolver with the given base directory.
  //
  // The returns function will resolve relative paths (but not URLs with
  // hostname) to files relative to the base directory.  For example:
  //
  // fileResolver('/var/www')('/foo.css') -> /var/www/foo.css
  // fileResolver('/var/www')('//exmaple.com/foo.css') -> null
  static fileResolver(directory) {

    return function resolve(url) {
      const hasHostname = (url.startsWith('//') || /^\w+:/.test(url));
      if (hasHostname)
        return null;

      // ../foo becomes /foo so /var/www/ + ../foo becomes /var/www/foo
      const absolute = Path.resolve('/', url);
      return Path.join(directory, absolute);
    };
  }


  // promise(html) -> promise(html)
  //
  // Inline CSS in the HTML document.
  //
  // Argument can be an HTML document (string) or promise that resolves to an
  // HTML document.  Returns a promise that resolves to an HTML document.
  //
  // All local stylesheets are loaded, processed through PostCSS.  Rules that
  // apply to the document directly are inlined.  Rules that cannot be inlined
  // (media queries, pseudo elements, etc) are added back into the document in
  // the form of a style element.
  inlineAsync(html) {
    const cache   = this._cache;
    const resolve = this._resolve;
    return Promise.resolve({ html, cache, resolve })
      .then(CSSInliner.parseHTML)
      .then(CSSInliner.extractRules)
      .then(CSSInliner.logWarnings)
      .then(CSSInliner.inlineRules)
      .then(CSSInliner.appendRules)
      .then(CSSInliner.domToHTML);
  }


  // promise(html) -> promise(html)
  //
  // Apply critical path CSS to the HTML document.
  //
  // Argument can be an HTML document (string) or promise that resolves to an
  // HTML document.  Returns a promise that resolves to an HTML document.
  //
  // All local stylesheets are loaded, processed through PostCSS, and then
  // added back into the document in the form of a style element.
  criticalAsync(html) {
    const cache   = this._cache;
    const resolve = this._resolve;
    return Promise.resolve({ html, cache, resolve })
      .then(CSSInliner.parseHTML)
      .then(CSSInliner.extractRules)
      .then(CSSInliner.logWarnings)
      .then(CSSInliner.appendRules)
      .then(CSSInliner.domToHTML);
  }


  // -- Processing steps --

  // { html, ... } -> promise({ dom, ... })
  //
  // Parses HTML string, returns htmlparser2 DOM.
  static parseHTML(context) {
    return Promise.resolve(context.html)
      .then(function(html) {

        const dom   = htmlparser2.parseDOM(html, {
          decodeEntities:           true,
          lowerCaseAttributeNames:  true,
          lowerCaseTags:            true,
          recognizeSelfClosing:     true,
          xmlMode:                  false
        });
        return _.assign({}, context, { dom });

      });
  }


  // { dom, cache, resolve } -> promise({ dom, rules, warnings })
  //
  // Extracts rules from stylesheets contained in document.  Removes style and
  // link elements from the DOM, modifying it.  Returns collection of PostCSS
  // rules and at-rules.
  static extractRules(context) {
    const dom     = context.dom;
    const cache   = context.cache;
    const resolve = context.resolve;
    return extractRules({ dom, cache, resolve })
      .then(function(result) {
        const rules       = result.rules;
        const warnings    = result.warnings;
        return { dom, rules, warnings };
      });
  }


  // { ... } -> { ... }
  //
  // Log any warnings from context.warnings.
  static logWarnings(context) {
    const warnings  = context.warnings;
    if (warnings && warnings.length)
      debug('Inline warnings:\n%s', warnings.join('\n'));
    return context;
  }


  // { dom, rules, ... } -> { dom, rules, ... }
  static inlineRules(context) {
    return inlineRules(context.dom, context.rules);
  }


  // { dom, rules } -> { dom }
  //
  // Creates a new style elements based on all available rules, and inserts it
  // into the DOM, either in the header or body.  Modifies the DOM.
  static appendRules(context) {
    const dom   = context.dom;
    const rules = context.rules;

    if (!rules || !rules.length)
      return context;

    const css = rules.map(function(rule) {
      return rule.toString();
    }).join(';');

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

    return { dom };
  }


  // { dom, ... } -> html
  //
  // Converts context.dom into an HTML string and returns it.
  static domToHTML(context) {
    const dom  = context.dom;
    const html = DOMUtils.getOuterHTML(dom);
    return html;
  }

};

