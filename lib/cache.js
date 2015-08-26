// Loading, processing and caching of stylesheets (PostCSS Result objects).
//
// Since stylesheet parsing can be expensive, an inliner will have one instance
// of this, to cache parsed stylesheets in memory.
//
//
// compile(css) -> promise(result)
//   Compiles source CSS, resolves to Result object
//
// load(filename) -> promise(result)
//   Loads stylesheet from file system, results to Result object

'use strict';
const Bluebird  = require('bluebird');
const Crypto    = require('crypto');
const File      = require('fs');
const postcss   = require('postcss');


module.exports = class Stylesheets {

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
      const loadAsync = Bluebird.promisify(File.readFile)(filename, 'utf-8');
      const promise   = loadAsync
        .then(function(css) {
          return processor.process(css);
        });
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
          const result  = processor.process(source);
          cache.set(key, result);
          return result;
        }
      });
  }

};

