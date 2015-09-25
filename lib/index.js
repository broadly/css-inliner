
// inlineAsync(html) -> promise(html)
//   Inline CSS in the HTML document.
//
// criticalAsync(html) -> promise(html)
//   Apply critical path CSS to the HTML document.


'use strict';

const addRules       = require('./add_rules');
const applyInline    = require('./apply_inline');
const Cache          = require('./cache');
const Context        = require('./context');
const domToHTML      = require('./dom_to_html');
const extractRules   = require('./extract_rules');
const logWarnings    = require('./log_warnings');
const selectDynamic  = require('./select_dynamic');
const parseHTML      = require('./parse_html');


module.exports = class CSSInliner {

  // Construct a new CSS inliner.
  //
  // Supported options:
  // plugins    - Array of PostCSS plugins to use
  // load       - Load CSS from URL, resolves to Buffer/String
  // compress   - True to compress output (default)
  constructor(options) {
    options = options || {};
    this._cache     = new Cache(options);
    this._compress  = options.compress === false ? false : true;
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
      .then(selectDynamic)
      .then(addRules)
      .then(domToHTML)
      .then(context => context.html);
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
      .then(addRules)
      .then(domToHTML)
      .then(context => context.html);
  }


  _resolveToContext(html) {
    return Promise.resolve(html)
      .then((html)=> {
        const context   = new Context({
          html,
          cache:    this._cache,
          compress: this._compress
        });
        return context;
      });
  }

};

