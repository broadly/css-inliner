// Loading, processing and caching of stylesheets.
//
// Since stylesheet parsing can be expensive, an inliner will have one instance
// of this, to cache parsed stylesheets in memory.
//
// compile(css) -> promise({ rules, warnings })
//   Compiles source CSS
//
// load(pathname) -> promise({ rules, warnings })
//   Loads stylesheet from file system

'use strict';
const Crypto    = require('crypto');
const Immutable = require('immutable');
const loadFrom  = require('./load_from');
const postcss   = require('postcss');


module.exports = class Cache {

  // Construct new cache.
  //
  // Supported options:
  // plugins    - Array of PostCSS plugins to use
  // load       - Load CSS from path name, resolves to Buffer/String
  constructor(options) {
    options = options || {};
    this._cache     = new Map();
    this._loadAsync = options.load || loadFrom(options.directory);
    const processor = postcss(options.plugins || []);
    this._parse     = processor.process.bind(processor);
  }


  // pathname -> promise({ rules, warnings })
  load(pathname) {
    const key = pathname;

    if (this._cache.has(key))
      return this._cache.get(key);
    else {
      const promise = this._loadAsync(pathname)
        .then(this._parse)
        .then(newCacheEntry);
      this._cache.set(key, promise);
      return promise;
    }
  }


  // string | buffer -> promise({ rules, warnings })
  compile(css) {
    try {
      const key = Crypto.createHash('sha').update(css).digest('hex');

      if (this._cache.has(key))
        return this._cache.get(key);
      else {
        const promise = Promise.resolve(css)
          .then(this._parse)
          .then(newCacheEntry);
        this._cache.set(key, promise);
        return promise;
      }

    } catch (error) {
      return Promise.reject(error);
    }
  }

};


// Cached entry is an immutable object with two properties:
// rules    - Immutable list of all rules in document order
// warnings - Immutable list of all parsing warnings
const CacheEntry = Immutable.Record({ rules: null, warnings: null });


// PostCSS Result -> CacheEntry
function newCacheEntry(result) {
  const rules     = Immutable.List(result.root.nodes);
  const warnings  = Immutable.List(result.warnings())
    .map(warning => warning.toString() );
  return new CacheEntry({ rules, warnings });
}


