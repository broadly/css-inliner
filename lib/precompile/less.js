// Precompile .less files.
//
// You can use this with the cache:
//
//   const precompile = CSSInliner.less;
//   const inliner    = new CSSInliner({ precompile });

'use strict';
const Path = require('path');


module.exports = function precompile(filename, source) {
  return isLess(filename) ? precompileSource(source) : source;
};


// Is this a Less stylesheet?
function isLess(filename) {
  const extension = Path.extname(filename);
  return (extension === '.less');
}


// (string | buffer) -> promise(string)
function precompileSource(source) {
  // Lazy load since Less is an optional dependency
  const Less  = require('less');
  // Less can't parse buffers
  const string = source.toString();
  return Less.render(string).then(result => result.css);
}

