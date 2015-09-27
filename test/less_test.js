'use strict';
const assert        = require('assert');
const Cache         = require('../lib/cache');
const Context       = require('../lib/context');
const CSSInliner    = require('../');
const CSSselect     = require('css-select');
const extractRules  = require('../lib/extract_rules');
const parseHTML     = require('../lib/parse_html');


describe('Extract Less stylesheets', function() {


  // html -> { dom, rules }
  function parseAndExtract(html) {
    const directory   = __dirname;
    const precompile  = CSSInliner.less;
    const cache       = new Cache({ directory, precompile });
    const context     = new Context({ html, cache });
    const parsed      = parseHTML(context);
    return extractRules(parsed);
  }


  describe('that exists', function() {

    let rules;
    let dom;

    before(function() {
      const html = '<head><link rel="stylesheet" href="/less_test.less"></head>';
      return parseAndExtract(html)
        .then(function(context) {
          dom   = context.dom;
          rules = context.rules;
        });
    });

    it('should remove all link elements', function() {
      const linkElements = CSSselect.selectAll('link', dom);
      assert.equal(linkElements.length, 0);
    });

    it('should collect all rules', function() {
      assert.equal(rules.size, 1);
      const rule = rules.get(0).toString().replace(/\s+/g, ' ');
      assert.equal(rule, 'div h1 { color: blue; }');
    });

  });


  describe('missing stylesheet', function() {

    it('should error', function() {
      const html    = `<link rel="stylesheet" href="/not_found.less">`;
      return parseAndExtract(html)
        .then(function() {
          assert(false, 'Expected an error');
        })
        .catch(function() { });
    });
  });

});


