'use strict';
const assert        = require('assert');
const CSSInliner    = require('../');
const CSSselect     = require('css-select');
const extractRules  = require('../lib/extract_rules');
const parseHTML     = require('../lib/parse_html');


describe('Extract stylesheets', function() {

  // [ rule ] -> [ string ]
  function ruleNames(rules) {
    return rules.map(rule => rule.name ? `@${rule.name}` : rule.selector);
  }

  // html -> { dom, rules }
  function parseAndExtract(html) {
    const inliner = new CSSInliner({ directory: __dirname });
    const context = inliner.newContext(html);
    return Promise.resolve(context)
      .then(parseHTML)
      .then(extractRules);
  }


  describe('that exist', function() {

    const html =
`<!-- extracted -->
<style>
  @media screen {
    h1 { color: red; }
  }
  h2 { color: green; }
  h3, h2:hover {
    text-decoration: underline;
  }
</style>
<link rel="stylesheet" href="/extract_rules.css">
<!-- not extracted -->
<link rel="stylesheet" href="http://example.com/external.css">`;

    let rules;
    let dom;

    before(function() {
      return parseAndExtract(html)
        .then(function(context) {
          dom   = context.dom;
          rules = context.rules;
        });
    });

    it('should remove all style elements', function() {
      const styleElements = CSSselect.selectAll('style', dom);
      assert.equal(styleElements.length, 0);
    });

    it('should remove only local stylesheets', function() {
      const linkElements = CSSselect.selectAll('link[rel~="stylesheet"]', dom);
      assert.equal(linkElements.length, 1);

      const href = linkElements[0].attribs.href;
      assert( href.startsWith('http://') );
    });

    it('should collect all rules', function() {
      assert.equal(rules.size, 4);

      const rule = rules.get(3).toString().replace(/\s+/g, ' ');
      assert.equal(rule, 'body { color: blue; }');
    });

    it('should collect rules in document order', function() {
      const names = ruleNames( rules );
      assert.deepEqual(names.toArray(), [ '@media', 'h2', 'h3, h2:hover', 'body' ]);
    });

  });


  describe('invalid CSS', function() {

    let parseError;

    before(function() {
      const html = '<style>@media screen { h1 { color: red; </style>';
      return parseAndExtract(html)
        .catch(function(error) {
          parseError = error;
        });
    });


    it('should report error with line number', function() {
      assert.equal(parseError.line, 1);
    });

    it('should report error with column number', function() {
      assert.equal(parseError.column, 17);
    });

    it('should report error with reason', function() {
      assert.equal(parseError.reason, 'Unclosed block');
    });

  });


  describe('missing stylesheet', function() {

    let loadError;

    before(function() {
      const html    = `<link rel="stylesheet" href="/not_found.css">`;
      return parseAndExtract(html)
        .catch(function(error) {
          loadError = error;
        });
    });

    it('should report error with path', function() {
      assert.equal(loadError.path, `${__dirname}/not_found.css`);
    });

    it('should report error with code', function() {
      assert.equal(loadError.code, 'ENOENT');
    });

  });

});

