'use strict';
const assert    = require('assert');
const CSSInline = require('../');
const File      = require('fs');


describe('Inline CSS', function() {

  let actual;

  before(function() {
    const inliner = new CSSInline({
      directory: __dirname
    });
    const source  = File.readFileSync(`${__dirname}/inline.html`, 'utf-8');
    return inliner
      .inlineCSSAsync(source)
      .then(function(result) {
        actual = result;
      });
  });

  it('should produced inlined document', function() {
    const expected = File.readFileSync(`${__dirname}/inline.expected.html`, 'utf-8');
    assert.equal(actual, expected);
  });

});
