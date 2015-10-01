'use strict';
const assert      = require('assert');
const CSSInliner  = require('../');
const PostCSS     = require('postcss');


describe('Warning', function() {

  const addWarning = PostCSS.plugin('add-warning', function() {
    return function(css, result) {
      result.warn('There was some error', { node: css });
    };
  });


  describe('from <style> element', function() {

    const warnings = [];

    before(function() {
      const html    = '<style></style><h1>Hello</h1>';
      const inliner = new CSSInliner({ plugins: [addWarning] });
      inliner.on('warning', function(warning) {
        warnings.push(warning);
      });
      return inliner.inlineCSSAsync(html);
    });

    it('should trigger warning event', function() {
      assert.equal(warnings.length, 1);
    });

    it('should report <inline> as the soruce', function() {
      assert.equal(warnings[0], '<inline>: add-warning: <css input>:1:1: There was some error');
    });
  });


  describe('from external stylesheet', function() {

    const warnings = [];

    before(function() {
      const html    = '<link href="test/inline.style.css" rel="stylesheet"><h1>Hello</h1>';
      const inliner = new CSSInliner({ plugins: [addWarning] });
      inliner.on('warning', function(warning) {
        warnings.push(warning);
      });
      return inliner.inlineCSSAsync(html);
    });

    it('should trigger warning event', function() {
      assert.equal(warnings.length, 1);
    });

    it('should report filename as the soruce', function() {
      assert.equal(warnings[0], 'test/inline.style.css: add-warning: <css input>:1:1: There was some error');
    });
  });


  describe('when using template tag as class', function() {

    const warnings = [];

    before(function() {
      const html      = '<h1 class="foo {{handlebars}} bar">Hello</h1>';
      const template  = CSSInliner.handlebars;
      const inliner   = new CSSInliner({ template });
      inliner.on('warning', function(warning) {
        warnings.push(warning);
      });
      return inliner.inlineCSSAsync(html);
    });

    it('should trigger warning event', function() {
      assert.equal(warnings.length, 1);
    });

    it('should report potential misuse of template tag', function() {
      assert.equal(warnings[0], '<unknown>: One of the elements is using template tag for its class name');
    });

  });


  describe('when event handler throws', function() {

    let lastError;

    before(function() {
      const html    = '<style></style><h1>Hello</h1>';
      const inliner = new CSSInliner({ plugins: [addWarning] });
      inliner.on('warning', function(warning) {
        throw new Error(warning);
      });
      return inliner.inlineCSSAsync(html)
        .catch(function(error) {
          lastError = error;
        });
    });

    it('should stop processing', function() {
      assert(lastError);
      assert.equal(lastError.message, '<inline>: add-warning: <css input>:1:1: There was some error');
    });
  });

});

