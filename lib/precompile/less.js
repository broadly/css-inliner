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


// string -> promise(string)
function precompileSource(source) {
  // Lazy load since Less is an optional dependency
  const Less  = require('less');

  return Less.render(source).then(result => result.css);
}

