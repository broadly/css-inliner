'use strict';
const assert  = require('assert');
const Cache   = require('../lib/cache');


describe('Compile CSS', function() {

  const cache   = new Cache();
  const css     = `body { color: red }`;
  const results = [];

  before(function() {
    return cache
      .compile(css)
      .then(function(result) {
        results.push(result);
      });
  });

  it('should return the result', function() {
    assert(results[0].root);
  });

  it('should parse the CSS', function() {
    const root = results[0].root;
    const body = root.nodes[0];
    assert.equal(body.selector, 'body');
    const decl = body.nodes[0];
    assert.equal(decl.prop, 'color');
    assert.equal(decl.value, 'red');
  });

  describe('compile again', function() {

    before(function() {
      assert.equal(results.length, 1);
      return cache
        .compile(css)
        .then(function(result) {
          results.push(result);
        });
    });

    it('should return cached result', function() {
      assert.equal(results[0], results[1]);
    });

  });

});


describe('Load and compile CSS', function() {

  const cache   = new Cache();
  const results = [];

  before(function() {
    return cache
      .load(`${__dirname}/blue_body.css`)
      .then(function(result) {
        results.push(result);
      });
  });

  it('should return the result', function() {
    assert(results[0].root);
  });

  it('should parse the CSS', function() {
    const root = results[0].root;
    const body = root.nodes[0];
    assert.equal(body.selector, 'body');
    const decl = body.nodes[0];
    assert.equal(decl.prop, 'color');
    assert.equal(decl.value, 'blue');
  });

  describe('load again', function() {

    before(function() {
      assert.equal(results.length, 1);
      return cache
        .load(`${__dirname}/blue_body.css`)
        .then(function(result) {
          results.push(result);
        });
    });

    it('should return cached result', function() {
      assert.equal(results[0], results[1]);
    });

  });

});


