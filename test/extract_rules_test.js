'use strict';
const assert        = require('assert');
const Cache         = require('../lib/cache');
const CSSselect     = require('css-select');
const extractAsync  = require('../lib/extract_rules');
const fileResolver  = require('../lib/file_resolver');
const parseHTML     = require('../lib/parse_html');


// [ Rule ] -> [ string ]
function ruleNames(rules) {
  return rules.map(function(rule) {
    return rule.name ? `@${rule.name}` : rule.selector;
  });
}

// /path -> __dirname/path
const resolve = fileResolver(__dirname);


describe('Extract stylesheets', function() {

  const dom = parseHTML(`
<html>
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
    <link rel="stylesheet" href="/blue_body.css">
    <!-- not extracted -->
    <link rel="stylesheet" href="http://example.com/external.css">
  </head>
</html>`);

  let rules;

  before(function() {
    const cache = new Cache();
    return extractAsync({ dom, cache, resolve })
      .then(function(result) {
        rules = result.rules;
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


describe('Invalid CSS', function() {

  const dom = parseHTML(`
<html>
  <head>
    <style>
      @media screen {
        h1 { color: red; }
    </style>
  </head>
</html>
  `);

  let parseError;

  before(function() {
    const cache = new Cache();
    return extractAsync({ dom, cache, resolve })
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


describe('Missing external stylesheet', function() {

  const dom = parseHTML(`
<html>
  <head>
    <link rel="stylesheet" href="/not_found">
  </head>
</html>
  `);

  let loadError;

  before(function() {
    const cache = new Cache();
    return extractAsync({ dom, cache, resolve })
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

