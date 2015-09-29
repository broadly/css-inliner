// The CSS inliner.
//
// Each instance maintains a cache of loaded and parsed CSS resources.

'use strict';
const addRules       = require('./add_rules');
const inlineRules    = require('./inline_rules');
const Cache          = require('./cache');
const Context        = require('./context');
const domToHTML      = require('./dom_to_html');
const extractRules   = require('./extract_rules');
const EventEmitter   = require('events').EventEmitter;
const less           = require('./precompile/less');
const selectDynamic  = require('./select_dynamic');
const parseHTML      = require('./parse_html');


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
  // plugins    - Array of PostCSS plugins to use
  // precompile - Use this to precompile other stylesheets, e.g Less/Sass (optional)
  constructor(options) {
    super();
    options = options || {};

    const cache     = new Cache(options);
    const compress  = options.compress === false ? false : true;
    this._context   = new Context({ cache, compress, inliner: this });

    // Default handler for reporting any warnings
    this.on('warning', this._warning.bind(this));
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
      .then(parseHTML)
      .then(extractRules)
      .then(inlineRules)
      .then(selectDynamic)
      .then(addRules)
      .then(domToHTML)
      .then(context => context.html);
  }


  // promise(html) -> promise(html)
  //
  // Apply critical path CSS to the HTML document.
  criticalPathAsync(html) {
    return this._newContextAsync(html)
      .then(parseHTML)
      .then(extractRules)
      .then(addRules)
      .then(domToHTML)
      .then(context => context.html);
  }


  _newContextAsync(html) {
    return Promise.resolve(html)
      .then(html => this._context.merge({ html }));
  }

  // Default on('message') event handler logs to console, but stays quiet if
  // any other event handler is registered.
  _warning(message) {
    const listeners     = this.listeners('warning');
    const onlyListener  = (listeners.length === 1);
    if (onlyListener)
      process.stderr.write(`css-inliner: ${message}\n`);
  }

};

