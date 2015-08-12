// Caching and parsing of stylesheets.  Caches PostCSS Result objects.
//
// Since stylesheet parsing can be expensive, an inliner will have one instance
// of this, to cache parsed stylesheets in memory.
//
//
// cache(css) -> promise(result)
//   Caches source CSS, resolves to Result object
//
// load(url) -> promise(result)
//   Loads stylesheet from URL, results to Result object


'use strict';
const assert      = require('assert');
const Bluebird    = require('bluebird');
const Crypto      = require('crypto');
const File        = require('fs');
const Path        = require('path');
const postcss     = require('postcss');
const ReadThrough = require('./read_through');
const request     = require('request');
const URL         = require('url');


// (url | path) -> promise(string)
function requestAsync(url) {
  if (/^https?:/.test(url))

    return Bluebird.promisify(request)
      .then(function(response) {
        const status = response.statusCode;
        if (status === 200)
          return response.body;
        else
          throw new Error(`Expected OK, got status code ${response.status}`);
      });

  else {

    const filename = url;
    return Bluebird.promisify(File.readFile)(filename, 'utf-8');

  }
}


module.exports = class Stylesheets {

  // Construct new cache for stylesheets.
  //
  // Available options:
  //
  //  directory - Resolve all relative paths from this directory
  //  resolve   - A function that resolves a relative path into a URL/filename
  //              for loading external resource
  //  plugins   - PostCSS plugins
  constructor(options) {
    options         = options || {};
    const plugins   = options.plugins || [];
    this._processor = postcss(plugins);
    this._cache     = new ReadThrough();

    if (options.directory)
      this.resolve = Stylesheets.fileResolver(options.directory);
    else if (options.resolve)
      this.resolve = options.resolve;
    else
      this.resolve = Stylesheets.nullResolver();
  }


  // Returns a URL resolver, a function that can safely resolve a path into an
  // absolute URL:
  //
  // resolve(path) -> url
  //
  // Regardless of the path, the result URL is guaranteed to be a URL within
  // the confines of the base URL..
  static urlResolver(baseURL) {
    const object = URL.parse(baseURL);
    assert(object.protocol, 'Base URL missing protocol');
    assert(object.hostname, 'Base URL missing hostname');
    const absolute = URL.resolve(baseURL + '/', '.');

    return function(path) {
      const pathname = URL.parse(path).pathname || '/';
      const anchored = URL.resolve('/', pathname).slice(1);
      return URL.resolve(absolute, anchored);
    };
  }


  // Returns a file resolver, a function that can safely resolve a path into an
  // absolute filename:
  //
  // resolve(path) -> filename
  //
  // Regardless of the path, the result filename is guaranteed to be a filename
  // within the confines of the base directory.
  static fileResolver(directory) {
    const absolute = Path.resolve(directory || '.');

    return function(path) {
      const anchored = Path.resolve('/', path);
      return Path.join(absolute, anchored);
    };
  }


  // Null resolver fails to resolve.
  static nullResolver() {
    return function(path) {
      throw new Error(`Cannot resolve external stylesheet at ${path}, did you set the directory option?`);
    };
  }


  // load(path) -> promise(Result)
  //
  // Load stylesheet from path, resolves to Result object of the parsed
  // stylesheet.
  //
  // The path is resolved relative to a base directory, a base URL, or by
  // calling the resolve function, depending on the settings.
  load(path) {
    try {
      const url       = this.resolve(path);
      const key       = url;
      const processor = this._processor;

      return this._cache.get(key, function() {
        return requestAsync(url)
          .then(function(source) {
            const result = processor.process(source);
            return result;
          });
      });

    } catch (error) {
      return Promise.reject(error);
    }
  }


  // cache(css) -> promise(Result)
  //
  // You can use this to cache parsed stylesheets, where you have the source CSS.
  cache(css) {
    const source    = css.toString();
    const key       = Crypto.createHash('sha').update(source).digest('hex');
    const processor = this._processor;

    return this._cache.get(key, function() {
      const result = processor.process(source);
      return result;
    });
  }

};

