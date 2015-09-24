'use strict';
const assert        = require('assert');
const Cache         = require('../lib/cache');
const Context       = require('../lib/context');
const CSSselect     = require('css-select');
const extractRules  = require('../lib/extract_rules');
const parseHTML     = require('../lib/parse_html');


// [ Rule ] -> [ string ]
function ruleNames(rules) {
  return rules.map(function(rule) {
    return rule.name ? `@${rule.name}` : rule.selector;
  });
}


describe('Extract stylesheets', function() {

  const cache   = new Cache({ directory: __dirname });

  describe('exists in file system', function() {

    const html =
  `<html>
    <head>
      <!-- extracted -->
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
      <link rel="stylesheet" href="http://example.com/external.css">
    </head>
  </html>`;

    let rules;
    let dom;

    before(function() {
      const context = new Context({ html, cache });
      const parsed  = parseHTML(context);
      dom = parsed.dom;

      return extractRules(parsed)
        .then(function(context) {
          rules = context.rules;
        });
    });

    it('should remove all style elements', function() {
      const styleElements = CSSselect.selectAll('style', dom);
      assert.equal(styleElements.length, 0);
    });

    it('should remove only resolved relative stylesheets', function() {
      const styleElements = CSSselect.selectAll('link[rel~="stylesheet"]', dom);
      assert.equal(styleElements.length, 1);
      const href = styleElements[0].attribs.href;
      assert( href.startsWith('http://') );
    });

    it('should collect all rules', function() {
      assert.equal(rules.size, 4);
    });

    it('should collect rules in document order', function() {

      const names = ruleNames( rules );
      assert.deepEqual(names.toArray(), [ '@media', 'h2', 'h3, h2:hover', 'body' ]);
    });

  });


  describe('invalid CSS', function() {

    const html =
`<html>
  <head>
    <style>
      @media screen {
        h1 { color: red; }
    </style>
  </head>
</html>`;

    let parseError;

    before(function() {
      const context = new Context({ html, cache });
      const parsed  = parseHTML(context);
      return extractRules(parsed)
        .catch(function(error) {
          parseError = error;
        });
    });


    it('should report error with line number', function() {
      assert.equal(parseError.line, 2);
    });

    it('should report error with column number', function() {
      assert.equal(parseError.column, 7);
    });

    it('should report error with reason', function() {
      assert.equal(parseError.reason, 'Unclosed block');
    });

  });


  describe('missing stylesheet', function() {

    const html =
  `<html>
    <head>
      <link rel="stylesheet" href="/not_found">
    </head>
  </html>`;

    let loadError;

    before(function() {
      const context = new Context({ html, cache });
      const parsed  = parseHTML(context);
      return extractRules(parsed)
        .catch(function(error) {
          loadError = error;
        });
    });

    it('should report error with path', function() {
      assert.equal(loadError.path, `${__dirname}/not_found`);
    });

    it('should report error with code', function() {
      assert.equal(loadError.code, 'ENOENT');
    });

  });

});

