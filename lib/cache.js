// Loading, processing and caching of stylesheets.

'use strict';
const assert    = require('assert');
const Crypto    = require('crypto');
const debug     = require('./debug');
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
    this._loadCSSAsync  = loadAsyncFromOptions(options);
    this._precompile    = precompileFromOptions(options);

    const plugins       = pluginsFromOptions(options);
    this._processor     = postcss(plugins);
  }


  // pathname -> promise({ rules, warnings })
  loadAsync(pathname) {
    try {
      assert(pathname, 'Pathname missing or empty string');
      const key = pathname;

      if (this._cache.has(key))
        return this._cache.get(key);
      else {
        const promise = this._loadAsync(pathname);
        this._cache.set(key, promise);
        return promise;
      }

    } catch (error) {
      return Promise.reject(error);
    }
  }

  // The acutal processing logic, separated from the caching.
  _loadAsync(pathname) {
    debug('Loading and compiling %s', pathname);
    return this._loadCSSAsync(pathname)
      .then(source => this._precompile(pathname, source))
      .then(css => this._processor.process(css))
      .then(result => resultToCacheEntry(pathname, result));
  }


  // string | buffer -> promise({ rules, warnings })
  compileAsync(css) {
    try {
      assert(css != null, 'Missing css argument');
      const key = Crypto.createHash('sha1').update(css).digest('hex');

      if (this._cache.has(key))
        return this._cache.get(key);
      else {
        const promise = this._compileAsync(css);
        this._cache.set(key, promise);
        return promise;
      }

    } catch (error) {
      return Promise.reject(error);
    }
  }

  // The acutal processing logic, separated from the caching.
  _compileAsync(css) {
    debug('Compiling inline CSS "%s..."', css.slice(0, 50));
    return this._processor.process(css)
      .then(result => resultToCacheEntry('<inline>', result));
  }

};


// Uses option.loadAsync or the default behavior
function loadAsyncFromOptions(options) {
  const loadAsync = options.loadAsync;
  if (loadAsync) {
    assert(typeof loadAsync === 'function', `options.loadAsync must be a function`);
    return loadAsync;
  } else
    return loadFrom(options.directory);
}


// Uses options.precompile or the default behavior
function precompileFromOptions(options) {
  const precompile = options.precompile;
  if (precompile) {
    assert(typeof precompile === 'function', `options.precompile must be a function`);
    const stringify = (filename, buffer) => precompile(filename, buffer.toString());
    return stringify;
  } else {
    const noop = (filename, source) => source;
    return noop;
  }
}


// Uses options.plugins, allow for string and array
function pluginsFromOptions(options) {
  const plugins = options.plugins || [];
  return Array.isArray(plugins) ? plugins : [ plugins ];
}


// Cached entry is an immutable object with two properties:
// rules    - Immutable list of all rules in document order
// warnings - Immutable list of all parsing warnings
const CacheEntry = Immutable.Record({ rules: null, warnings: null });


// PostCSS Result -> CacheEntry
function resultToCacheEntry(pathname, result) {
  const rules     = Immutable.List(result.root.nodes);
  const warnings  = Immutable.List(result.warnings())
    .map(warning => `${pathname}: ${warning}`);
  return new CacheEntry({ rules, warnings });
}

