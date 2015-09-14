// Resolvers help locate a file on disk from a URL reference in the document.
//
// fileResolver(directory)
//   Returns a function that resolves relative path URLs to files within the
//   given directory.

'use strict';
const Path = require('path');
const URL  = require('url');


// Returns a function that resolves relative path URLs to files within the given
// directory.
//
// fileResolver('/var/www')('/foo.css') -> /var/www/foo.css
// fileResolver('/var/www')('//exmaple.com/foo.css') -> null
module.exports = function fileResolver(directory) {

  return function resolve(url) {
    // don't trip on href=" ../foo "
    const trimmed     = url.trim();
    // ../foo becomes /foo so /var/www/ + ../foo becomes /var/www/foo
    const absolute    = URL.resolve('/', trimmed);
    // http://example.com and //example.com both reference host name
    const hasHostname = (absolute.startsWith('//') || /^\w+:/.test(absolute));
    if (hasHostname)
      return null;
    else
      return Path.join(directory, absolute);
  };
};

