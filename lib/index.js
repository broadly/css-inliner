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
const handlebars    = require('./templates/handlebars');
const less           = require('./precompile/less');
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
  // loadAsync  - Load CSS from path name, resolves to Buffer/String
  // plugins    - Array of PostCSS plugins to use
  // precompile - Use this to precompile other stylesheets, e.g Less/Sass (optional)
  // template   - Function for listing template tags (optional)
  constructor(options) {
    options = options || {};
    const cache     = new Cache(options);
    const compress  = options.compress === false ? false : true;
    const template  = options.template;
    this._context   = new Context({ cache, template, compress });
  }


  // Returns template handler for Handlebars.
  static get handlebars() {
    return handlebars;
  }


  // Returns precompile option for supporing Less stylesheets: files that use
  // the .less extension will be recompiled.
  static get less() {
    return less;
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
    return Promise.resolve(html)
      .then(html => this._context.set('html', html));
  }

};

