'use strict';
const assert            = require('assert');
const Cache             = require('../lib/cache');
const Context           = require('../lib/context');
const onlyDynamicRules  = require('../lib/only_dynamic_rules');


describe('Dynamic rules', function() {

  const css = `
  @media screen and (max-width: 300px) {
    body { width: 300px; }
  }
  @media print {
    .footer { display: none; }
  }
  @font-face {
      font-family: "Bitstream Vera Serif Bold";
  }
  body, h1:hover {
    color: red;
  }
  p {
    color: blue;
  }
  [name=foo], div {
    color: green;
  }
  `;
  let rules;

  before(function() {
    const cache = new Cache();
    return cache.compile(css)
      .then(function(result) {
        const context = new Context(result);
        rules = onlyDynamicRules(context).rules;
      });
  });

  it('should include all media queries', function() {
    const media = rules
      .filter(rule => rule.type === 'atrule')
      .filter(rule => rule.name === 'media');
    assert.equal(media.size, 2);
    assert.equal(media.get(0).params, 'screen and (max-width: 300px)');
    assert.equal(media.get(1).params, 'print');
  });

  it('should include font faces', function() {
    const fontFace = rules
      .filter(rule => rule.type === 'atrule')
      .filter(rule => rule.name === 'font-face');
    assert.equal(fontFace.size, 1);
    const fontFamily = fontFace.get(0).nodes[0].toString();
    assert.equal(fontFamily, 'font-family: "Bitstream Vera Serif Bold"');
  });

  it('should include rules with pseudo selectors', function() {
    const pseudo = rules
      .filter(rule => rule.type === 'rule')
      .filter(rule => /:/.test(rule.selectors) );
    assert.equal(pseudo.size, 1);
    const declarations = pseudo.get(0).nodes;
    assert.equal(declarations, 'color: red');
  });

  it('should include only the pseudo selector', function() {
    const pseudo = rules
      .filter(rule => rule.type === 'rule')
      .filter(rule => /:/.test(rule.selectors) );
    const selector = pseudo.get(0).selector;
    assert.equal(selector, 'h1:hover');
  });

  it('should include rules with attribute selectors', function() {
    const attribute = rules
      .filter(rule => rule.type === 'rule')
      .filter(rule => /\[/.test(rule.selectors) );
    assert.equal(attribute.size, 1);
    const declarations = attribute.get(0).nodes;
    assert.equal(declarations, 'color: green');
  });

  it('should include only the attribute selectors', function() {
    const attribute = rules
      .filter(rule => rule.type === 'rule')
      .filter(rule => /\[/.test(rule.selectors) );
    const selector = attribute.get(0).selector;
    assert.equal(selector, '[name=foo]');
  });

  it('should not include rules without dynamic selectors', function() {
    const notDynamic = rules
      .filter(rule => rule.type === 'rule')
      .filter(rule => !/[:[]/.test(rule.selectors) );
    assert.equal(notDynamic.size, 0);
  });

});

