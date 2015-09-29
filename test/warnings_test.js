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


  describe('during CSS processing', function() {

    const warnings = [];

    before(function() {
      const html    = `<style></style><h1>Hello</h1>`;
      const inliner = new CSSInliner({ plugins: [addWarning] });
      inliner.on('warning', function(warning) {
        warnings.push(warning);
      });
      return inliner.inlineCSSAsync(html);
    });

    it('should trigger warning event', function() {
      assert.equal(warnings.length, 1);
      assert.equal(warnings[0], 'add-warning: <css input>:1:1: There was some error');
    });

  });


  describe('when event handler throws', function() {

    let lastError;

    before(function() {
      const html    = `<style></style><h1>Hello</h1>`;
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
      assert.equal(lastError.message, 'add-warning: <css input>:1:1: There was some error');
    });
  });


  describe.skip('when using template tag as class', function() {

    const warnings = [];

    before(function() {
      const html      = `<style></style><h1 class="foo {{handlbars}} bar">Hello</h1>`;
      const template  = CSSInliner.handlbars;
      const inliner   = new CSSInliner({ template });
      inliner.on('warning', function(warning) {
        warnings.push(warning);
      });
      return inliner.inlineCSSAsync(html);
    });

    it('should trigger warning event', function() {
      assert.equal(warnings.length, 1);
      assert.equal(warnings[0], 'Using template tag as CSS class can lead to errors');
    });

  });

});

