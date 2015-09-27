'use strict';
const assert        = require('assert');
const Context       = require('../lib/context');
const CSSInliner    = require('../');
const domToHTML     = require('../lib/dom_to_html');
const parseHTML     = require('../lib/parse_html');
const TemplateTags  = require('../lib/template_tags');


describe('Handlebar templates', function() {

  function roundTrip(html) {
    const context     = new Context({ html });
    const stashed     = TemplateTags.stash(context);
    const parsed      = parseHTML(stashed);
    const serialized  = domToHTML(parsed);
    const restored    = TemplateTags.restore(serialized);
    return restored.html;
  }

  it('should allow expressions', function() {
    const html      = '<h1>{{message}}</h1><input value="{{time}}">';
    const expected  = html;
    const actual    = roundTrip(html);
    assert.equal(actual, expected);
  });

  it('should allow expressions (complex case)', function() {
    const html      = '{{#each articles.[10].[#comments]}}{{/each}}';
    const expected  = html;
    const actual    = roundTrip(html);
    assert.equal(actual, expected);
  });

  it('should allow un-encoded expressions', function() {
    const html      = '<h1>{{{raw}}}</h1>';
    const expected  = html;
    const actual    = roundTrip(html);
    assert.equal(actual, expected);
  });

  it('should allow helpers (with quoted args)', function() {
    const html      = '{{{link "See more..." href=story.url class="story"}}}';
    const expected  = html;
    const actual    = roundTrip(html);
    assert.equal(actual, expected);
  });

  it('should allow sub-expressions (with quoted args)', function() {
    const html      = '{{outer-helper (inner-helper "abc") "def"}}';
    const expected  = html;
    const actual    = roundTrip(html);
    assert.equal(actual, expected);
  });

  it('should allow escaped blocks', function() {
    const html      = '\\{{escaped}}\n{{{{raw}}}{{escaped}}{{{{/raw}}}}';
    const expected  = html;
    const actual    = roundTrip(html);
    assert.equal(actual, expected);
  });

  it('should allow escaped blocks (with quoted args)', function() {
    const html      = '\\{{escaped "foo"}}\n{{{{raw "bar"}}}{{escaped "foo"}}{{{{/raw}}}}';
    const expected  = html;
    const actual    = roundTrip(html);
    assert.equal(actual, expected);
  });

  it('should allow blocks around elements', function() {
    const html      = '{{#if user}}<h1>Welcome back</h1>{{/else}}Login{{/if}}';
    const expected  = html;
    const actual    = roundTrip(html);
    assert.equal(actual, expected);
  });

  it('should allow blocks in attribute values', function() {
    const html      = '<input value="{{#if user}}{{user}}{{/else}}unknown{{/if}}">';
    const expected  = html;
    const actual    = roundTrip(html);
    assert.equal(actual, expected);
  });

  it('should allow blocks in attribute values (with quoted args)', function() {
    const html      = '<input value="{{#if user}}{{format user "f.L"}}{{/else}}unknown{{/if}}">';
    const expected  = html;
    const actual    = roundTrip(html);
    assert.equal(actual, expected);
  });

  it('should allow blocks with parameters', function() {
    const html      = '{{#each users as |user userId|}}\nId: {{userId}} Name: {{user.name}}\n{{/each}}';
    const expected  = html;
    const actual    = roundTrip(html);
    assert.equal(actual, expected);
  });

  it('should allow comments', function() {
    const html      = '{{! This comment will not be in the output }}\n<!-- This comment will be in the output -->';
    const expected  = '{{! This comment will not be in the output }}\n';
    const actual    = roundTrip(html);
    assert.equal(actual, expected);
  });

  it('should allow comments (with quotes)', function() {
    const html      = '{{! This "comment" should work }}';
    const expected  = html;
    const actual    = roundTrip(html);
    assert.equal(actual, expected);
  });

  it('should allow partials (with quoted args)', function() {
    const html      = '{{> userMessage tagName="h1" }}';
    const expected  = html;
    const actual    = roundTrip(html);
    assert.equal(actual, expected);
  });

  it('should not fail on multiple line tags', function() {
    const html      = '{{userMessage\ntag="h1"\nname="assaf"}}';
    const expected  = html;
    const actual    = roundTrip(html);
    assert.equal(actual, expected);
  });


  describe('inline CSS', function() {

    it('should retain template tags', function() {
      const html      = '<style>.foo{color:red}</style><div class="foo">{{userMessage tagName="h1"}}</div>';
      const expected  = '<div class="foo" style="color:red">{{userMessage tagName="h1"}}</div>';
      const inliner   = new CSSInliner();
      return inliner
        .inlineCSSAsync(html)
        .then(function(actual) {
          assert.equal(actual, expected);
        });
    });
  });


  describe('critical path', function() {

    it('should retain template tags', function() {
      const html      = '<style>.foo{color:red}</style><div class="foo">{{userMessage tagName="h1"}}</div>';
      const expected  = html;
      const inliner   = new CSSInliner();
      return inliner
        .criticalPathAsync(html)
        .then(function(actual) {
          assert.equal(actual, expected);
        });
    });
  });

});

