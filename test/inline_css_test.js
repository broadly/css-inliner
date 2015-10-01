'use strict';
const assert      = require('assert');
const CSSInliner  = require('../');
const File        = require('fs');


describe('Inline CSS', function() {

  const inliner = new CSSInliner({ directory: __dirname });

  it('should produce inlined document', function() {
    const html      = File.readFileSync(`${__dirname}/inline.html`, 'utf-8');
    const expected  = File.readFileSync(`${__dirname}/inline.expected.html`, 'utf-8');
    return inliner
      .inlineCSSAsync(html)
      .then(function(actual) {
        assert.equal(actual, expected);
      });
  });

});
