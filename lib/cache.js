// Loading, processing and caching of stylesheets.  Cached stylesheets are objects with two properties:
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
// load(filename) -> promise(result)
//   Loads stylesheet from file system, resolves to { rules, warnings }

'use strict';
const Bluebird  = require('bluebird');
const Crypto    = require('crypto');
const File      = require('fs');
const Immutable = require('immutable');
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
  constructor(plugins) {
    this._processor = postcss(plugins || []);
    this._cache     = new Map();
  }


  // filename -> promise(Result)
  //
  // Load stylesheet from file system, resolves to Result object of the parsed
  // stylesheet.
  load(filename) {
    const key       = filename;
    const cache     = this._cache;
    const processor = this._processor;

    if (cache.has(key))
      return cache.get(key);
    else {
      const loadAsync = Bluebird.promisify(File.readFile)(filename, 'utf8');
      const promise   = loadAsync
        .then(css => processor.process(css))
        .then(immutableResult);
      cache.set(key, promise);
      return promise;
    }
  }


  // css -> promise(Result)
  //
  // You can use this to cache parsed stylesheets, where you have the source CSS.
  compile(cssPromise) {
    const cache     = this._cache;
    const processor = this._processor;

    return Promise.resolve(cssPromise)
      .then(function(css) {
        const source = css.toString();
        const key    = Crypto.createHash('sha').update(source).digest('hex');

        if (cache.has(key))
          return cache.get(key);
        else {
          const result    = processor.process(source);
          const immutable = immutableResult(result);
          cache.set(key, immutable);
          return immutable;
        }
      });
  }

};

