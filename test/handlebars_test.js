'use strict';
const assert        = require('assert');
const Context       = require('../lib/context');
const CSSInliner    = require('../');
const domToHTML     = require('../lib/dom_to_html');
const parseHTML     = require('../lib/parse_html');
const TemplateTags  = require('../lib/template_tags');


describe('Handlebar templates', function() {

  function replaceTags(template) {

    function substitute(template, tag, index) {
      const marker = `$${index + 1}`;
      return template.split(tag).join(marker);
    }

    const tags  = CSSInliner.handlebars(template);
    const html  = tags.reduce(substitute, template);
    return html;
  }

  it('should not escape expressions', function() {
    const html      = '<h1>{{message}}</h1><input value="{{time}}">';
    const expected  = '<h1>$1</h1><input value="$2">';
    const actual    = replaceTags(html);
    assert.equal(actual, expected);
  });

  it('should not escape expressions (complex case)', function() {
    const html      = '{{#each articles.[10].[#comments]}}{{/each}}';
    const expected  = '$1';
    const actual    = replaceTags(html);
    assert.equal(actual, expected);
  });

  it('should not escape un-encoded expressions', function() {
    const html      = '<h1>{{{raw}}}</h1>';
    const expected  = '<h1>$1</h1>';
    const actual    = replaceTags(html);
    assert.equal(actual, expected);
  });

  it('should not escape helpers (with quoted args)', function() {
    const html      = '{{{link "See more..." href=story.url class="story"}}}';
    const expected  = '$1';
    const actual    = replaceTags(html);
    assert.equal(actual, expected);
  });

  it('should not escape sub-expressions (with quoted args)', function() {
    const html      = '{{outer-helper (inner-helper "abc") "def"}}';
    const expected  = '$1';
    const actual    = replaceTags(html);
    assert.equal(actual, expected);
  });

  it('should escape raw blocks (special tag)', function() {
    const html      = '{{{{raw}}}}{{escaped}}{{{{/raw}}}}';
    const expected  = '$1{{escaped}}$2';
    const actual    = replaceTags(html);
    assert.equal(actual, expected);
  });

  it('should escape raw blocks (escape)', function() {
    const html      = '\\{{escaped "foo"}}';
    const expected  = '\\{{escaped "foo"}}';
    const actual    = replaceTags(html);
    assert.equal(actual, expected);
  });

  it('should not escape blocks around elements (no inverse)', function() {
    const html      = '{{#if user}}<h1>Welcome back</h1>{{/if}}';
    const expected  = '$1<h1>Welcome back</h1>$2';
    const actual    = replaceTags(html);
    assert.equal(actual, expected);
  });

  it('should not escape blocks around elements (empty inverse)', function() {
    const html      = '{{#if user}}<h1>Welcome back</h1>{{else}}{{/if}}';
    const expected  = '$1<h1>Welcome back</h1>$2';
    const actual    = replaceTags(html);
    assert.equal(actual, expected);
  });

  it('should not escape blocks around elements (inverse only)', function() {
    const html      = '{{#if user}}{{else}}Login{{/if}}';
    const expected  = '$1Login$2';
    const actual    = replaceTags(html);
    assert.equal(actual, expected);
  });

  it('should not escape blocks around elements (with inverse)', function() {
    const html      = '{{#if user}}<h1>Welcome back</h1>{{else}}Login{{/if}}';
    const expected  = '$1<h1>Welcome back</h1>$2Login$3';
    const actual    = replaceTags(html);
    assert.equal(actual, expected);
  });

  it('should not escape blocks around elements (empty everything)', function() {
    const html      = '{{#if user}}{{else}}{{/if}}';
    const expected  = '$1';
    const actual    = replaceTags(html);
    assert.equal(actual, expected);
  });

  it('should not escape blocks in attribute values', function() {
    const html      = '<input value="{{#if user}}{{user}}{{else}}Login{{/if}}">';
    const expected  = '<input value="$1$2$3Login$4">';
    const actual    = replaceTags(html);
    assert.equal(actual, expected);
  });

  it('should not escape blocks in attribute values (with quoted args)', function() {
    const html      = '<input value="{{#if user}}{{format user "f.L"}}{{else}}Login{{/if}}">';
    const expected  = '<input value="$1$2$3Login$4">';
    const actual    = replaceTags(html);
    assert.equal(actual, expected);
  });

  it('should not escape blocks with parameters', function() {
    const html      = '{{#each users as |user userId|}}\nId: {{userId}} Name: {{user.name}}\n{{/each}}';
    const expected  = '$1\nId: $2 Name: $3\n$4';
    const actual    = replaceTags(html);
    assert.equal(actual, expected);
  });

  it('should not escape comments', function() {
    const html      = '{{! This comment will not be in the output }}\n<!-- This comment will be in the output -->';
    const expected  = '$1\n<!-- This comment will be in the output -->';
    const actual    = replaceTags(html);
    assert.equal(actual, expected);
  });

  it('should not escape partials (with quoted args)', function() {
    const html      = '{{> userMessage tagName="h1" }}';
    const expected  = '$1';
    const actual    = replaceTags(html);
    assert.equal(actual, expected);
  });

  it('should not fail on multiple line tags', function() {
    const html      = '{{userMessage\ntag="h1"\nname="assaf"}}';
    const expected  = '$1';
    const actual    = replaceTags(html);
    assert.equal(actual, expected);
  });

  it('should deal with quoted braces', function() {
    const html      = '{{userMessage single=\'}}\' double="}}" }}';
    const expected  = '$1';
    const actual    = replaceTags(html);
    assert.equal(actual, expected);
  });

  it('should deal with duplicate tags', function() {
    const tag       = '{{userMessage tag="h1"}}';
    const html      = `${tag}${tag}`;
    const expected  = '$1$1';
    const actual    = replaceTags(html);
    assert.equal(actual, expected);
  });

  it('should deal with arbitrary nesting', function() {
    const html      = '{{#foo}}a{{#bar}}b{{else}}c{{/bar}}d{{/foo}}e';
    const expected  = '$1a$2b$3c$4d$5e';
    const actual    = replaceTags(html);
    assert.equal(actual, expected);
  });


  describe('inline CSS', function() {

    it('should retain template tags', function() {
      const html      = '<style>.foo{color:red}</style><div class="foo">{{userMessage tagName="h1"}}</div>';
      const expected  = '<div class="foo" style="color:red">{{userMessage tagName="h1"}}</div>';
      const template  = CSSInliner.handlebars;
      const inliner   = new CSSInliner({ template });
      return inliner
        .inlineCSSAsync(html)
        .then(function(actual) {
          assert.equal(actual, expected);
        });
    });

    it('should deal with tags in style element', function() {
      const html      = '<style>.foo{color:red}</style><div class="foo" style="{{style "foo"}}"></div>';
      const expected  = '<div class="foo" style="{{style "foo"}};color:red"></div>';
      const inliner   = new CSSInliner({ template: CSSInliner.handlebars });
      return inliner
        .inlineCSSAsync(html)
        .then(function(actual) {
          assert.equal(actual, expected);
        });
    });

    it('should deal with nested template tags', function() {
      const html      = '{{foo}}<!--skip-->{{bar tag="{{foo}}"}}';
      const expected  = '{{foo}}{{bar tag="{{foo}}"}}';
      const inliner   = new CSSInliner({ template: CSSInliner.handlebars });
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
      const template  = CSSInliner.handlebars;
      const inliner   = new CSSInliner({ template });
      return inliner
        .criticalPathAsync(html)
        .then(function(actual) {
          assert.equal(actual, expected);
        });
    });
  });


  describe('without tag extraction', function() {

    it('should treat them as HTML content', function() {
      const html      = '<div class="foo">{{userMessage tagName="h1"}}</div>';
      const expected  = '<div class="foo">{{userMessage tagName=&quot;h1&quot;}}</div>';
      const inliner   = new CSSInliner();
      return inliner
        .inlineCSSAsync(html)
        .then(function(actual) {
          assert.equal(actual, expected);
        });
    });

  });

});

