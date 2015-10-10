'use strict';
const addRules  = require('../lib/add_rules');
const assert    = require('assert');
const Cache     = require('../lib/cache');
const Context   = require('../lib/context');
const domToHTML = require('../lib/dom_to_html');
const parseHTML = require('../lib/parse_html');


describe('Add rules', function() {

  const css = `@media print{.footer{display:none}}h1:hover,h1:before{color:red;background:none}`;

  function parseAndAddRules(html) {
    const cache = new Cache();
    return cache.compileAsync(css)
      .then(function(result) {
        const rules   = result.rules;
        const context = new Context({ html, rules });
        const parsed  = parseHTML(context);
        addRules(parsed);

        const withRules = domToHTML(parsed).html;
        return withRules;
      });
  }


  describe('to document with head', function() {
    it('should insert rules at beginning of head', function() {
      const html      = '<html><head><title>Hello</title></head><body><h1>Some div</h1></body></html>';
      const expected  = `<html><head><style>${css}</style><title>Hello</title></head><body><h1>Some div</h1></body></html>`;
      return parseAndAddRules(html)
        .then(function(actual) {
          assert.equal(actual, expected);
        });
    });
  });


  describe('to document with body and no head', function() {
    it('should insert rules at beginning of body', function() {
      const html      = '<body><h1>Som div</h1></body>';
      const expected  = `<body><style>${css}</style><h1>Som div</h1></body>`;
      return parseAndAddRules(html)
        .then(function(actual) {
          assert.equal(actual, expected);
        });
    });
  });


  describe('to document with no body and no head', function() {
    it('should insert rules at beginning of document', function() {
      const html      = '<div>Some div</div>';
      const expected  = `<style>${css}</style><div>Some div</div>`;
      return parseAndAddRules(html)
        .then(function(actual) {
          assert.equal(actual, expected);
        });
    });

  });
});
