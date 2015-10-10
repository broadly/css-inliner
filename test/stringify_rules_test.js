'use strict';
const assert          = require('assert');
const Cache           = require('../lib/cache');
const stringifyRules  = require('../lib/stringify_rules');


describe('Stringify rules', function() {

  const source = `
@charset "UTF-8";

/* Media rules for printers */
@media print {
  .footer {
    display: none;
  }
}


/* Ample spacing that gets eliminated */
h1:hover,  h1:before  {
  color       : red ;
  background  : none !important;
}

`;

  let rules;

  before(function() {
    const cache = new Cache();
    return cache.compileAsync(source)
      .then(function(result) {
        rules = result.rules;
      });
  });

  describe('without compression', function() {

    it('should produce same CSS minus empty lines', function() {
      const expected  = source.replace(/\n+/gm, '\n').trim();
      const actual    = stringifyRules(rules, false);
      console.log(rules)
      console.log(actual)
      assert.equal(actual, expected);
    });

  });

  describe('with compression', function() {


    it('should squeeze spaces and comments out of the CSS', function() {
      const expected  = `@charset "UTF-8";@media print{.footer{display:none}}h1:hover,h1:before{color:red;background:none !important}`;
      const actual    = stringifyRules(rules, true);
      assert.equal(actual, expected);
    });

  });

});

