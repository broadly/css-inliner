
// inlineAsync(html) -> promise(html)
//   Inline CSS in the HTML document.
//
// criticalAsync(html) -> promise(html)
//   Apply critical path CSS to the HTML document.


'use strict';

const appendRules       = require('./append_rules');
const applyInline       = require('./apply_inline');
const Cache             = require('./cache');
const Context           = require('./context');
const domToHTML         = require('./dom_to_html');
const extractRules      = require('./extract_rules');
const fileResolver      = require('./file_resolver');
const logWarnings       = require('./log_warnings');
const onlyDynamicRules  = require('./only_dynamic_rules');
const parseHTML         = require('./parse_html');


module.exports = class CSSInliner {

  // Construct a new CSS inliner.
  constructor(options) {
    options = options || {};
    this._cache     = new Cache(options.plugins);
    this._resolve   = options.resolve || fileResolver(options.directory);
    this._compress  = true;
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
    return this._resolveToContext(html)
      .then(parseHTML)
      .then(extractRules)
      .then(logWarnings)
      .then(applyInline)
      .then(onlyDynamicRules)
      .then(appendRules)
      .then(domToHTML);
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
    return this._resolveToContext(html)
      .then(parseHTML)
      .then(extractRules)
      .then(logWarnings)
      .then(appendRules)
      .then(domToHTML);
  }


  _resolveToContext(html) {
    return Promise.resolve(html)
      .then((html)=> {
        const context   = new Context({
          html,
          cache:    this._cache,
          resolve:  this._resolve,
          compress: this._compress
        });
        return context;
      });
  }

};

