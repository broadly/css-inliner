'use strict';
const assert      = require('assert');
const ElementType = require('domelementtype');
const matchRule   = require('../lib/match_rule');
const PostCSS     = require('postcss');


describe('Rule matcher', function() {

  const rule    = PostCSS.rule({
    selector: 'p, #foo, h1:hover',
    nodes: [
      PostCSS.decl({ prop: 'color',   value: 'red' }),
      PostCSS.decl({ prop: 'border',  value: 'none', important: true })
    ]
  });
  const match = matchRule(rule);


  describe('for element by tag', function() {

    const element = {
      type:     ElementType.Tag,
      name:     'p',
      attribs:  { class: 'pretty' }
    };

    it('should return all properties', function() {
      const properties = match(element);
      assert.equal(properties[0].name, 'color');
      assert.equal(properties[1].name, 'border');
    });

    it('should return all properties with their values', function() {
      const properties = match(element);
      assert.equal(properties[0].value, 'red');
      assert.equal(properties[1].value, 'none');
    });

    it('should return all properties with their important flag', function() {
      const properties = match(element);
      assert.equal(properties[0].important, false);
      assert.equal(properties[1].important, true);
    });

    it('should return properties with specificity 001', function() {
      const properties = match(element);
      for (let property of properties)
        assert.equal(property.specificity, '001');
    });

  });


  describe('for element by id', function() {

    const element = {
      type:     ElementType.Tag,
      name:     'div',
      attribs:  { id: 'foo' }
    };

    it('should return all properties', function() {
      const properties = match(element);
      assert.equal(properties[0].name, 'color');
      assert.equal(properties[1].name, 'border');
    });

    it('should return properties with specificity 100', function() {
      const properties = match(element);
      for (let property of properties)
        assert.equal(property.specificity, '100');
    });
  });


  describe('for element by tag and id', function() {

    const element = {
      type:     ElementType.Tag,
      name:     'p',
      attribs:  { id: 'foo' }
    };

    it('should return all properties', function() {
      const properties = match(element);
      assert.equal(properties[0].name, 'color');
      assert.equal(properties[1].name, 'border');
    });

    it('should return properties with highest specificity (100)', function() {
      const properties = match(element);
      for (let property of properties)
        assert.equal(property.specificity, '100');
    });
  });


  describe('for element with pseudo class', function() {

    const element = {
      type: ElementType.Tag,
      name: 'h1'
    };

    it('should return null', function() {
      const properties = match(element);
      assert.equal(properties, null);
    });
  });


  describe('no matching element', function() {

    const element = { };

    it('should return null', function() {
      const properties = match(element);
      assert.equal(properties, null);
    });
  });

});
