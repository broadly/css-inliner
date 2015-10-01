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


  describe('for element matched by tag', function() {

    const element = {
      type:     ElementType.Tag,
      name:     'p',
      attribs:  { class: 'pretty' }
    };

    describe('matched properties', function() {
      it('should have names', function() {
        const properties = match(element);
        assert.equal(properties.get(0).name, 'color');
        assert.equal(properties.get(1).name, 'border');
      });

      it('should have values', function() {
        const properties = match(element);
        assert.equal(properties.get(0).value, 'red');
        assert.equal(properties.get(1).value, 'none');
      });

      it('should have the important flag', function() {
        const properties = match(element);
        assert.equal(properties.get(0).important, false);
        assert.equal(properties.get(1).important, true);
      });

      it('should have specificity of 001', function() {
        const properties = match(element);
        for (let property of properties)
          assert.equal(property.specificity, '001');
      });
    });

  });


  describe('for element matched by id', function() {

    const element = {
      type:     ElementType.Tag,
      name:     'div',
      attribs:  { id: 'foo' }
    };

    describe('matched properties', function() {
      it('should have names', function() {
        const properties = match(element);
        assert.equal(properties.get(0).name, 'color');
        assert.equal(properties.get(1).name, 'border');
      });

      it('should have specificity of 100', function() {
        const properties = match(element);
        for (let property of properties)
          assert.equal(property.specificity, '100');
      });
    });
  });


  describe('for element matched by id and separately tag selector', function() {

    const element = {
      type:     ElementType.Tag,
      name:     'p',
      attribs:  { id: 'foo' }
    };

    describe('matched properties', function() {
      it('should have names', function() {
        const properties = match(element);
        assert.equal(properties.get(0).name, 'color');
        assert.equal(properties.get(1).name, 'border');
      });

      // We only match the id selector (100) and no the tag selector (001)
      it('should have specificity of 100', function() {
        const properties = match(element);
        for (let property of properties)
          assert.equal(property.specificity, '100');
      });
    });
  });


  describe('for element only matched with pseudo class', function() {

    const element = {
      type: ElementType.Tag,
      name: 'h1'
    };

    it('should return no properties', function() {
      const properties = match(element);
      assert.equal(properties, null);
    });
  });


  describe('when no elements would match', function() {

    const element = { };

    it('should return no properties', function() {
      const properties = match(element);
      assert.equal(properties, null);
    });
  });

});

