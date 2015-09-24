// Loading, processing and caching of stylesheets.
//
// Cached stylesheets are objects with two properties:
// rules    - immutable list of rules
// warnings - immutable list of warnings
//
// Since stylesheet parsing can be expensive, an inliner will have one instance
// of this, to cache parsed stylesheets in memory.
//
//
// compile(css) -> promise(result)
//   Compiles source CSS, resolves to { rules, warnings }
//
// load(url) -> promise(result)
//   Loads stylesheet from file system, resolves to { rules, warnings }

'use strict';
const Crypto    = require('crypto');
const Immutable = require('immutable');
const loadFrom  = require('./load_from');
const postcss   = require('postcss');


// PostCSS result into { rules, warnings }
function immutableResult(result) {
  const rules     = Immutable.List(result.root.nodes);
  const warnings  = Immutable.List(result.warnings())
    .map(warning => warning.toString() );
  return { rules, warnings };
}


module.exports = class Cache {

  // Construct new cache.
  //
  // plugins    - PostCSS plugins to use
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
    const key       = url;

    if (this._cache.has(key))
      return this._cache.get(key);
    else {
      const promise   = this._loadAsync(url)
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

