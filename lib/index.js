// The CSS inliner.
//
// Each instance maintains a cache of loaded and parsed CSS resources.

'use strict';
const addRules      = require('./add_rules');
const inlineRules   = require('./inline_rules');
const Cache         = require('./cache');
const Context       = require('./context');
const domToHTML     = require('./dom_to_html');
const EventEmitter   = require('events').EventEmitter;
const extractRules  = require('./extract_rules');
const handlebars    = require('./templates/handlebars');
const less           = require('./precompile/less');
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
//
// on('warning', function(warning) { ... })
//   This event is emmited to warn you about issues with the CSS or HTML that
//   is not necessarily an error.  Processing will continue unless you throw an
//   exception.
module.exports = class CSSInliner extends EventEmitter {

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
    super();
    options = options || {};
    const cache     = new Cache(options);
    const compress  = (options.compress) === false ? false : true;
    const template  = options.template;
    this._context   = new Context({ cache, compress, inliner: this, template });

    // Default handler for reporting any warnings
    this.on('warning', this._onWarning.bind(this));
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


  // promise(html, options?) -> promise(html)
  //
  // Inline CSS into the HTML document.
  inlineCSSAsync(html, options) {
    return this._newContextAsync(html, options)
      .then(TemplateTags.stash)
      .then(parseHTML)
      .then(extractRules)
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
  criticalPathAsync(html, options) {
    return this._newContextAsync(html, options)
      .then(TemplateTags.stash)
      .then(parseHTML)
      .then(extractRules)
      .then(addRules)
      .then(domToHTML)
      .then(TemplateTags.restore)
      .then(context => context.html);
  }


  // Create a new context for processing specific HTML resource
  _newContextAsync(html, options) {
    const filename = options && options.filename || '<unknown>';
    return Promise.resolve(html)
      .then(html => this._context.set('html', html).set('filename', filename));
  }


  // Default on('message') event handler logs to console, but stays quiet if
  // any other event handler is registered.
  _onWarning(message) {
    const listeners     = this.listeners('warning');
    const isOnlyListener  = (listeners.length === 1);
    if (isOnlyListener)
      process.stderr.write(`css-inliner: ${message}\n`);
  }

};

