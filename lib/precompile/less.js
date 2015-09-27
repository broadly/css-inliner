// Load and compile Less files from given directory.
//
// You can use this with the cache:
//
//   const precompile = CSSInliner.less;
//   const inliner    = new CSSInliner({ precompile });

'use strict';
const Less      = require('less');
const loadFrom  = require('../load_from');
const Path      = require('path');


// A variant of loadFrom that can compile Less stylesheets.
module.exports = function loadLessFrom(directory) {
  const loadAsync = loadFrom(directory);
  return function loadLessAsync(filename) {
    const loadPromise = loadAsync(filename);
    return isLess(filename) ? loadPromise.then(compileLess) : loadPromise;
  };
};


// Is this a Less stylesheet?
function isLess(filename) {
  const extension = Path.extname(filename);
  return (extension === '.less');
}


// (string | buffer) -> promise(string)
function compileLess(source) {
  const less = source.toString();
  return Less.render(less).then(result => result.css);
}

