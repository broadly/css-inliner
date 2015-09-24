// Loading, processing and caching of stylesheets.
//
// Since stylesheet parsing can be expensive, an inliner will have one instance
// of this, to cache parsed stylesheets in memory.
//
// compile(css) -> promise({ rules, warnings })
//   Compiles source CSS
//
// load(url) -> promise({ rules, warnings })
//   Loads stylesheet from file system

'use strict';
const Crypto    = require('crypto');
const Immutable = require('immutable');
const loadFrom  = require('./load_from');
const postcss   = require('postcss');


// Cached stylesheet is an object with two properties:
// rules    - immutable list of rules
// warnings - immutable list of rules
const CachedResult = Immutable.Record({ rules: null, warnings: null });

// PostCSS result into { rules, warnings }
function immutableResult(result) {
  const rules     = Immutable.List(result.root.nodes);
  const warnings  = Immutable.List(result.warnings())
    .map(warning => warning.toString() );
  return new CachedResult({ rules, warnings });
}


module.exports = class Cache {

  // Construct new cache.
  //
  // Supported options:
  // plugins    - Array of PostCSS plugins to use
  // load       - Load CSS from URL, resolves to Buffer/String
  constructor(options) {
    options = options || {};
    this._processor = postcss(options.plugins || []);
    this._cache     = new Map();
    this._loadAsync = options.load || loadFrom(options.directory);
  }


  // url -> promise(Result)
  //
  // Load stylesheet from file system, resolves to Result object of the parsed
  // stylesheet.
  load(url) {
    const key = url;

    if (this._cache.has(key))
      return this._cache.get(key);
    else {
      const promise = this._loadAsync(url)
        .then(css => this._processor.process(css))
        .then(immutableResult);
      this._cache.set(key, promise);
      return promise;
    }
  }


  // css -> promise(Result)
  //
  // You can use this to cache parsed stylesheets, where you have the source CSS.
  compile(cssPromise) {
    return Promise.resolve(cssPromise)
      .then(css => {
        const source = css.toString();
        const key    = Crypto.createHash('sha').update(source).digest('hex');

        if (this._cache.has(key))
          return this._cache.get(key);
        else {
          const result    = this._processor.process(source);
          const immutable = immutableResult(result);
          this._cache.set(key, immutable);
          return immutable;
        }
      });
  }

};

