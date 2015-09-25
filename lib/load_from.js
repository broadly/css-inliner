// The cache uses this to load CSS stylesheets from the file system.
//
// This module serves two main purposes:
//
// 1. Safely resolve relative URLs in the document into absolute filenames (e.g.
//    href="/main.css" resolves to /var/www/stylesheets/main.css.
//
//    This is important enough to unit test, since we don't want random URLs to
//    traverse the file system (e.g. "../../passwords.txt")
//
// 2. Load the CSS source code.  Since this is pluggable component, alternative
//    implementations can be used to process Less, SASS and other languages.
//
//    An alternative implementation can be based on this function, by adding
//    another processing step, e.g:
//
//      function loadLessFrom(directory) {
//        const loadLess = loadFrom(directory);
//
//        return function(url) {
//          return loadLess(url).then(parseLess);
//        };
//      }


'use strict';
const assert  = require('assert');
const debug   = require('debug')('css-inliner');
const File    = require('fs');
const Path    = require('path');
const URL     = require('url');


// To load CSS stylesheet from a URL relative to a base directory:
//
// 1. Call this function with the base directory, returns curried function
// 2. Call curried function with the URL, returns a promise
// 3. Promise resolves to a Buffer/String
module.exports = function loadFrom(directory) {
  directory = directory || process.cwd();
  const curried = loadAsync.bind(null, directory);
  return curried;
};


// (directory, url) => promise(buffer)
function loadAsync(directory, url) {
  try {
    const filename = urlToFilename(directory, url);
    debug(`Resolved relative URL "${url}" to filename "${filename}"`);
    const promise  = readFileAsync(filename);
    return promise;

  } catch (error) {
    return Promise.resolve(error);
  }
}


// (url, directory) -> filename
function urlToFilename(directory, url) {
  assert(url && url.length, 'URL missing or empty string');
  // don't trip on href=" ../foo "
  const trimmed     = url.trim();
  // ../foo becomes /foo so [ /var/www/, ../foo ] becomes /var/www/foo and not /var/foo
  const safePath    = URL.resolve('/', trimmed);
  // url -> filename
  const filename    = Path.join(directory, safePath);
  return filename;
}


// filename -> promise(buffer)
function readFileAsync(filename) {
  return new Promise(function(resolve, reject) {
    File.readFile(filename, function(error, buffer) {
      if (error)
        reject(error);
      else
        resolve(buffer);
    });
  });
}
