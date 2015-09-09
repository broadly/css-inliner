'use strict';
const assert                  = require('assert');
const specificityFromSelector = require('../lib/specificity');

describe('Specificity', function() {

  it('should count no ID as 0xx', function() {
    const selector    = 'div.foo';
    const specificity = specificityFromSelector(selector);
    assert.equal(specificity[0], '0');
  });

  it('should count ID as 1xx', function() {
    const selector    = 'div#foo';
    const specificity = specificityFromSelector(selector);
    assert.equal(specificity[0], '1');
  });

  it('should count three IDs as 3xx', function() {
    const selector    = 'div#foo div#bar #qoo b';
    const specificity = specificityFromSelector(selector);
    assert.equal(specificity[0], '3');
  });


  it('should count no class or attribute as x0x', function() {
    const selector    = 'div#foo';
    const specificity = specificityFromSelector(selector);
    assert.equal(specificity[1], '0');
  });

  it('should count one class as x1x', function() {
    const selector    = 'div.foo';
    const specificity = specificityFromSelector(selector);
    assert.equal(specificity[1], '1');
  });

  it('should count three classes as x3x', function() {
    const selector    = 'div.foo div#bar.bar .qoo b';
    const specificity = specificityFromSelector(selector);
    assert.equal(specificity[1], '3');
  });

  it('should count one attribute as x1x', function() {
    const selector    = 'div[foo]';
    const specificity = specificityFromSelector(selector);
    assert.equal(specificity[1], '1');
  });

  it('should count three attribute as x3x', function() {
    const selector    = 'div[foo=foo] div#bar[bar=^bar] [id] b';
    const specificity = specificityFromSelector(selector);
    assert.equal(specificity[1], '3');
  });


  it('should count no ID as xx0', function() {
    const selector    = '.foo';
    const specificity = specificityFromSelector(selector);
    assert.equal(specificity[2], '0');
  });

  it('should count one tag as xx1', function() {
    const selector    = 'div#foo';
    const specificity = specificityFromSelector(selector);
    assert.equal(specificity[2], '1');
  });

  it('should count three tags as xx3', function() {
    const selector    = 'div#foo div.bar [qoo] b';
    const specificity = specificityFromSelector(selector);
    assert.equal(specificity[2], '3');
  });


  it('should return three digits', function() {
    const selector    = 'div#foo div.bar [qoo] b';
    const specificity = specificityFromSelector(selector);
    // ID -> 1
    // Class, attribute -> 2
    // Tags -> 3
    assert.equal(specificity, '123');
  });

});
