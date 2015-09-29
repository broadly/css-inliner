// Loading, processing and caching of stylesheets.

'use strict';
const assert    = require('assert');
const Crypto    = require('crypto');
const Immutable = require('immutable');
const loadFrom  = require('./load_from');
const postcss   = require('postcss');


// Since stylesheet parsing can be expensive, an inliner will have one instance
// of this, to cache parsed stylesheets in memory.
//
// compileAsync(css) -> promise({ rules, warnings })
//   Compiles source CSS
//
// loadAsync(pathname) -> promise({ rules, warnings })
//   Loads stylesheet from file system
module.exports = class Cache {

  // Construct new cache.
  //
  // Supported options:
  // directory  - Directory to load CSS resources from (defaults to cwd)
  // plugins    - Array of PostCSS plugins to use
  // loadAsync  - Load CSS from path name, resolves to Buffer/String
  // precompile - Use this to precompile other stylesheets, e.g Less/Sass (optional)
  constructor(options) {
    options = options || {};
    this._cache         = new Map();
    this._loadCSSAsync  = loadAsyncOption(options);
    this._precompile    = precompileOption(options);
    const processor     = postcss(options.plugins || []);
    this._parse         = processor.process.bind(processor);
  }


  // pathname -> promise({ rules, warnings })
  loadAsync(pathname) {
    const key = pathname;

    if (this._cache.has(key))
      return this._cache.get(key);
    else {
      const promise = this._loadCSSAsync(pathname)
        .then(buffer => buffer.toString())
        .then(source => this._precompile(pathname, source))
        .then(this._parse)
        .then(newCacheEntry);
      this._cache.set(key, promise);
      return promise;
    }
  }


  // string | buffer -> promise({ rules, warnings })
  compileAsync(css) {
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


// Uses option.loadAsync or the default behavior
function loadAsyncOption(options) {
  if (options.loadAsync) {
    assert(typeof options.loadAsync === 'function', `options.loadAsync must be a function`);
    return options.loadAsync;
  } else
    return loadFrom(options.directory);
}


// Uses options.precompile or the default behavior
function precompileOption(options) {
  if (options.precompile) {
    assert(typeof options.precompile === 'function', `options.precompile must be a function`);
    return options.precompile;
  } else
    return (filename, source) => source;
}


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

