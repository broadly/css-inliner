'use strict';
const assert            = require('assert');
const Cache             = require('../lib/cache');
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
        const allRules  = result.root.nodes;
        rules           = onlyDynamicRules(allRules);
      });
  });

  it('should include all media queries', function() {
    const media = rules
      .filter(rule => rule.type === 'atrule')
      .filter(rule => rule.name === 'media');
    assert.equal(media.length, 2);
    assert.equal(media[0].params, 'screen and (max-width: 300px)');
    assert.equal(media[1].params, 'print');
  });

  it('should include font faces', function() {
    const fontFace = rules
      .filter(rule => rule.type === 'atrule')
      .filter(rule => rule.name === 'font-face');
    assert.equal(fontFace.length, 1);
    assert.equal(fontFace[0].nodes[0].toString(), 'font-family: "Bitstream Vera Serif Bold"');
  });

  it('should include rules with pseudo selectors', function() {
    const pseudo = rules
      .filter(rule => rule.type === 'rule')
      .filter(rule => /:/.test(rule.selectors) );
    assert.equal(pseudo.length, 1);
    assert.equal(pseudo[0].nodes, 'color: red');
  });

  it('should include only the pseudo selector', function() {
    const pseudo = rules
      .filter(rule => rule.type === 'rule')
      .filter(rule => /:/.test(rule.selectors) );
    assert.equal(pseudo[0].selector, 'h1:hover');
  });

  it('should include rules with attribute selectors', function() {
    const attribute = rules
      .filter(rule => rule.type === 'rule')
      .filter(rule => /\[/.test(rule.selectors) );
    assert.equal(attribute.length, 1);
    assert.equal(attribute[0].nodes, 'color: green');
  });

  it('should include only the attribute selectors', function() {
    const attribute = rules
      .filter(rule => rule.type === 'rule')
      .filter(rule => /\[/.test(rule.selectors) );
    assert.equal(attribute[0].selector, '[name=foo]');
  });

  it('should not include rules without dynamic selectors', function() {
    const notDynamic = rules
      .filter(rule => rule.type === 'rule')
      .filter(rule => !/[:[]/.test(rule.selectors) );
    assert.equal(notDynamic.length, 0);
  });

});

