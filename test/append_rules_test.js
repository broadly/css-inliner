'use strict';
const appendRules = require('../lib/append_rules');
const assert      = require('assert');
const Cache       = require('../lib/cache');
const DOMUtils    = require('domutils');
const parseHTML   = require('../lib/parse_html');


describe('Append rules', function() {

  const sourceCSS = `
    @media print {
      .footer {
        display: none;
      }
    }

    h1:hover,  h1:before  {
      color : red ;
      background: none ;
    }
  `;
  const expectedCSS = `@media print{.footer{display:none}}h1:hover,h1:before{color:red;background:none}`;

  let   rules;

  before(function() {
    const cache = new Cache();
    return cache.compile(sourceCSS)
      .then(function(result) {
        rules  = result.root.nodes;
      });
  });

  describe('to document with head', function() {

    const dom = parseHTML('<html><head><title>Hello</title></head><body><h1>Some div</h1></body></html>');

    before(function() {
      appendRules(dom, rules);
    });

    it('should append rules to beginning of head', function() {
      const expected  = `<html><head><style>${expectedCSS}</style><title>Hello</title></head><body><h1>Some div</h1></body></html>`;
      const html = DOMUtils.getOuterHTML(dom);
      assert.equal(html, expected);
    });
  });

  describe('to document with body and no head', function() {

    const dom = parseHTML('<body><h1>Som div</h1></body>');

    before(function() {
      appendRules(dom, rules);
    });

    it('should append rules to beginning of body', function() {
      const expected  = `<body><style>${expectedCSS}</style><h1>Som div</h1></body>`;
      const html      = DOMUtils.getOuterHTML(dom);
      assert.equal(html, expected);
    });
  });

  describe('to document with no body or head', function() {

    const dom = parseHTML('<div>Some div</div>');

    before(function() {
      appendRules(dom, rules);
    });

    it('should append rules to beginning of document', function() {
      const expected  = `<style>${expectedCSS}</style><div>Some div</div>`;
      const html      = DOMUtils.getOuterHTML(dom);
      assert.equal(html, expected);
    });

  });
});
