'use strict';
const addRules  = require('../lib/add_rules');
const assert    = require('assert');
const Cache     = require('../lib/cache');
const Context   = require('../lib/context');
const DOMUtils  = require('domutils');
const parseHTML = require('../lib/parse_html');


describe('Add rules', function() {

  const css =
`@media print {
  .footer {
    display: none;
  }
}
h1:hover,  h1:before  {
  color : red ;
  background: none ;
}`;

  let   rules;

  before(function() {
    const cache = new Cache();
    return cache.compile(css)
      .then(function(result) {
        rules  = result.rules;
      });
  });


  describe('to document with head', function() {

    const html = '<html><head><title>Hello</title></head><body><h1>Some div</h1></body></html>';
    let   dom;

    before(function() {
      const initial = new Context({ html, rules });
      const parsed  = parseHTML(initial);
      addRules(parsed);
      dom = parsed.dom;
    });

    it('should insert rules to beginning of head', function() {
      const expected  = `<html><head><style>${css}</style><title>Hello</title></head><body><h1>Some div</h1></body></html>`;
      const html = DOMUtils.getOuterHTML(dom);
      assert.equal(html, expected);
    });
  });


  describe('to document with body and no head', function() {

    const html    = '<body><h1>Som div</h1></body>';
    let   dom;

    before(function() {
      const initial = new Context({ html, rules });
      const parsed  = parseHTML(initial);
      addRules(parsed);
      dom = parsed.dom;
    });

    it('should insert rules to beginning of body', function() {
      const expected  = `<body><style>${css}</style><h1>Som div</h1></body>`;
      const html      = DOMUtils.getOuterHTML(dom);
      assert.equal(html, expected);
    });
  });


  describe('to document with no body or head', function() {

    const html    = '<div>Some div</div>';
    let   dom;

    before(function() {
      const initial = new Context({ html, rules });
      const parsed  = parseHTML(initial);
      addRules(parsed);
      dom = parsed.dom;
    });

    it('should insert rules to beginning of document', function() {
      const expected  = `<style>${css}</style><div>Some div</div>`;
      const html      = DOMUtils.getOuterHTML(dom);
      assert.equal(html, expected);
    });

  });
});
