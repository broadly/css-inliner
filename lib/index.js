// The CSS inliner.
//
// Each instance maintains a cache of loaded and parsed CSS resources.

'use strict';
const addRules      = require('./add_rules');
const inlineRules   = require('./inline_rules');
const Cache         = require('./cache');
const Context       = require('./context');
const domToHTML     = require('./dom_to_html');
const extractRules  = require('./extract_rules');
const logWarnings   = require('./log_warnings');
const selectDynamic = require('./select_dynamic');
const parseHTML     = require('./parse_html');
const TemplateTags  = require('./template_tags');


// CSS inliner supports two main methods:
//
// inlineCSSAsync(html) -> promise(html)
//   Inline CSS into the HTML document.
//
// criticalPathAsync(html) -> promise(html)
//   Apply critical path CSS to the HTML document.
module.exports = class CSSInliner {

  // Construct a new CSS inliner.
  //
  // Supported options:
  // compress   - True to compress output (default)
  // directory  - Directory to load CSS resources from (defaults to cwd)
  // plugins    - Array of PostCSS plugins to use
  // loadAsync  - Load CSS from path name, resolves to Buffer/String
  constructor(options) {
    options = options || {};
    this._cache     = new Cache(options);
    this._compress  = options.compress === false ? false : true;
  }


  // promise(html) -> promise(html)
  //
  // Inline CSS into the HTML document.
  inlineCSSAsync(html) {
    return this._newContextAsync(html)
      .then(TemplateTags.stash)
      .then(parseHTML)
      .then(extractRules)
      .then(logWarnings)
      .then(inlineRules)
      .then(selectDynamic)
      .then(addRules)
      .then(domToHTML)
      .then(TemplateTags.restore)
      .then(context => context.html);
  }


  // promise(html) -> promise(html)
  //
  // Apply critical path CSS to the HTML document.
  criticalPathAsync(html) {
    return this._newContextAsync(html)
      .then(TemplateTags.stash)
      .then(parseHTML)
      .then(extractRules)
      .then(logWarnings)
      .then(addRules)
      .then(domToHTML)
      .then(TemplateTags.restore)
      .then(context => context.html);
  }


  _newContextAsync(html) {
    const cache =    this._cache;
    const compress = this._compress;
    return Promise.resolve(html)
      .then(html => new Context({ html, cache, compress }) );
  }

};

