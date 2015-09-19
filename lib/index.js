
// inlineAsync(html) -> promise(html)
//   Inline CSS in the HTML document.
//
// criticalAsync(html) -> promise(html)
//   Apply critical path CSS to the HTML document.


'use strict';
const name = require('../package.json').name;

const appendRules       = require('./append_rules');
const applyInline       = require('./apply_inline');
const Cache             = require('./cache');
const debug             = require('debug')(name);
const DOMUtils          = require('domutils');
const extractRules      = require('./extract_rules');
const fileResolver      = require('./file_resolver');
const onlyDynamicRules  = require('./only_dynamic_rules');
const parseHTML         = require('./parse_html');


module.exports = class CSSInliner {

  // Construct a new CSS inliner.
  constructor(options) {
    options = options || {};
    this._cache   = new Cache(options.plugins);
    this._resolve = options.resolve || fileResolver(options.directory);
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
        const dom = parseHTML(html);
        context.dom = dom;
        return context;
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
    if (warnings && warnings.size)
      debug('Inline warnings:\n%s', warnings.join('\n'));
    return context;
  }


  // { dom, rules, ... } -> { dom, rules, ... }
  static inlineRules(context) {
    applyInline(context.dom, context.rules);
    context.rules = onlyDynamicRules(context.rules);
    return context;
  }


  // { dom, rules } -> { dom }
  //
  // Creates a new style elements based on all available rules, and inserts it
  // into the DOM, either in the header or body.  Modifies the DOM.
  static appendRules(context) {
    const dom   = context.dom;
    const rules = context.rules;
    appendRules(dom, rules);
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

