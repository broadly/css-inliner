'use strict';
const assert      = require('assert');
const CSSInliner  = require('../');


describe('Extract Less stylesheets', function() {


  // html -> { dom, rules }
  function parseAndExtract(html) {
    const directory   = __dirname;
    const precompile  = CSSInliner.less;
    const inliner     = new CSSInliner({ directory, precompile });
    return inliner.inlineCSSAsync(html);
  }


  describe('that exist', function() {

    it('should compile Less and inline as CSS', function() {
      const html      = '<link rel="stylesheet" href="/less_test.less"><div><h1>Blue</h1></blue>';
      const expected  = '<div><h1 style="color:blue">Blue</h1></div>';
      return parseAndExtract(html)
        .then(function(actual) {
          assert.equal(actual, expected);
        });
    });

  });


  describe('missing stylesheet', function() {

    it('should error', function() {
      const html = `<link rel="stylesheet" href="/not_found.less">`;
      return parseAndExtract(html)
        .then(function() {
          assert(false, 'Expected an error');
        })
        .catch(function() { });
    });
  });

});


