'use strict';
const assert                = require('assert');
const calculateSpecificity  = require('../lib/calc_specificity');


describe('Specificity', function() {

  describe('for ID', function() {

    it('should count no ID as 0xx', function() {
      const selector    = 'div.foo';
      const specificity = calculateSpecificity(selector);
      assert.equal(specificity[0], '0');
    });

    it('should count one ID as 1xx', function() {
      const selector    = 'div#foo';
      const specificity = calculateSpecificity(selector);
      assert.equal(specificity[0], '1');
    });

    it('should count three IDs as 3xx', function() {
      const selector    = 'div#foo div#bar #qoo b';
      const specificity = calculateSpecificity(selector);
      assert.equal(specificity[0], '3');
    });

    it('should cap ID count at 9', function() {
      const selector    = '#0 #1 #2 #3 #4 #5 #6 #7 #8 #9 #10 #11 #12';
      const specificity = calculateSpecificity(selector);
      assert.equal(specificity[0], '9');
    });

  });


  describe('for class', function() {

    it('should count no class as x0x', function() {
      const selector    = 'div#foo';
      const specificity = calculateSpecificity(selector);
      assert.equal(specificity[1], '0');
    });

    it('should count one class as x1x', function() {
      const selector    = 'div.foo';
      const specificity = calculateSpecificity(selector);
      assert.equal(specificity[1], '1');
    });

    it('should count three classes as x3x', function() {
      const selector    = 'div.foo div#bar.bar .qoo b';
      const specificity = calculateSpecificity(selector);
      assert.equal(specificity[1], '3');
    });

    it('should cap class count at 9', function() {
      const selector    = '.0 .1 .2 .3 .4 .5 .6 .7 .8 .9 .10 .11 .12';
      const specificity = calculateSpecificity(selector);
      assert.equal(specificity[1], '9');
    });

  });


  describe('for attribute', function() {

    it('should count no attribute as x0x', function() {
      const selector    = 'div#foo';
      const specificity = calculateSpecificity(selector);
      assert.equal(specificity[1], '0');
    });

    it('should count one attribute as x1x', function() {
      const selector    = 'div[foo]';
      const specificity = calculateSpecificity(selector);
      assert.equal(specificity[1], '1');
    });

    it('should count three attributes as x3x', function() {
      const selector    = 'div[foo=foo] div#bar[bar=^bar] [id] b';
      const specificity = calculateSpecificity(selector);
      assert.equal(specificity[1], '3');
    });

    it('should cap attribute count at 9', function() {
      const selector    = '.0 .1 .2 .3 .4 .5 .6 .7 .8 .9 .10 .11 .12';
      const specificity = calculateSpecificity(selector);
      assert.equal(specificity[1], '9');
    });

  });


  describe('for tag', function() {

    it('should count no tag as xx0', function() {
      const selector    = '.foo';
      const specificity = calculateSpecificity(selector);
      assert.equal(specificity[2], '0');
    });

    it('should count one tag as xx1', function() {
      const selector    = 'div#foo';
      const specificity = calculateSpecificity(selector);
      assert.equal(specificity[2], '1');
    });

    it('should count three tags as xx3', function() {
      const selector    = 'div#foo div.bar [qoo] b';
      const specificity = calculateSpecificity(selector);
      assert.equal(specificity[2], '3');
    });

    it('should cap tag count at 9', function() {
      const selector    = 'p b b b b b b b b b b b i';
      const specificity = calculateSpecificity(selector);
      assert.equal(specificity[2], '9');
    });

  });


  describe('for ID, class, attribute and tag', function() {

    it('should return three digits', function() {
      const selector    = 'div#foo div.bar [qoo] b';
      const specificity = calculateSpecificity(selector);
      assert.equal(specificity.length, 3);
    });

    it('should return 1xx, since ID', function() {
      const selector    = 'div#foo div.bar [qoo] b';
      const specificity = calculateSpecificity(selector);
      assert.equal(specificity[0], '1');
    });

    it('should return x2x, since class and attribute', function() {
      const selector    = 'div#foo div.bar [qoo] b';
      const specificity = calculateSpecificity(selector);
      assert.equal(specificity[1], '2');
    });

    it('should return xx3, since three tags', function() {
      const selector    = 'div#foo div.bar [qoo] b';
      const specificity = calculateSpecificity(selector);
      assert.equal(specificity[2], '3');
    });
  });

});

