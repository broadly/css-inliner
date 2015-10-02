'use strict';
const assert     = require('assert');
const precedence = require('../lib/precedence');


describe('Precedence when', function() {

  describe('only first declaration provided', function() {
    it('should return first declaration', function() {
      const first   = { value: 'first' };
      const second  = null;
      const result  = precedence(first, second);
      assert.equal(result.value, 'first');
    });
  });

  describe('only second declaration provided', function() {
    it('should return second declaration', function() {
      const first   = null;
      const second  = { value: 'second' };
      const result  = precedence(first, second);
      assert.equal(result.value, 'second');
    });
  });

  describe('only first declaration is important', function() {
    it('should return first declaration', function() {
      const first   = { value: 'first',   important: true };
      const second  = { value: 'second',  important: false };
      const result  = precedence(first, second);
      assert.equal(result.value, 'first');
    });
  });

  describe('only second declaration is important', function() {
    it('should return second declaration', function() {
      const first   = { value: 'first',   important: false };
      const second  = { value: 'second',  important: true };
      const result  = precedence(first, second);
      assert.equal(result.value, 'second');
    });
  });

  describe('first declaration has higher specificity', function() {
    it('should return first declaration', function() {
      const first   = { value: 'first',   specificity: '100' };
      const second  = { value: 'second',  specificity: '099' };
      const result  = precedence(first, second);
      assert.equal(result.value, 'first');
    });
  });

  describe('second declaration has higher specificity', function() {
    it('should return second declaration', function() {
      const first   = { value: 'first',   specificity: '100' };
      const second  = { value: 'second',  specificity: '101' };
      const result  = precedence(first, second);
      assert.equal(result.value, 'second');
    });
  });

  describe('second declarations important but has lower specificity', function() {
    it('should return second declaration', function() {
      const first   = { value: 'first',   important: false, specificity: '100' };
      const second  = { value: 'second',  important: true,  specificity: '099' };
      const result  = precedence(first, second);
      assert.equal(result.value, 'second');
    });
  });

  describe('both declarations not important and have same specificity', function() {
    it('should return second declaration', function() {
      const first   = { value: 'first',   important: false, specificity: '123' };
      const second  = { value: 'second',  important: false, specificity: '123' };
      const result  = precedence(first, second);
      assert.equal(result.value, 'second');
    });
  });

  describe('both declarations important and have same specificity', function() {
    it('should return second declaration', function() {
      const first   = { value: 'first',   important: true, specificity: '123' };
      const second  = { value: 'second',  important: true, specificity: '123' };
      const result  = precedence(first, second);
      assert.equal(result.value, 'second');
    });
  });

  describe('both declarations important and first has higher specificity', function() {
    it('should return first declaration', function() {
      const first   = { value: 'first',   important: true, specificity: '100' };
      const second  = { value: 'second',  important: true, specificity: '099' };
      const result  = precedence(first, second);
      assert.equal(result.value, 'first');
    });
  });

  describe('both declarations important and second has higher specificity', function() {
    it('should return first declaration', function() {
      const first   = { value: 'first',   important: true, specificity: '100' };
      const second  = { value: 'second',  important: true, specificity: '101' };
      const result  = precedence(first, second);
      assert.equal(result.value, 'second');
    });
  });

});
