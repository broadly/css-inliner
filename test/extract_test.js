'use strict';
const assert          = require('assert');
const CSSselect       = require('css-select');
const extractAsync    = require('../lib/extract_stylesheets');
const parseHTMLAsync  = require('../lib/parse_html');
const Stylesheets     = require('../lib/stylesheets');


// [ Rule ] -> [ string ]
function ruleNames(rules) {
  return rules.map(function(rule) {
    return rule.name ? `@${rule.name}` : rule.selector;
  });
}


describe('Extract stylesheets', function() {

  const HTML = `
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
    <link rel="stylesheet" href="blue_body.css">
    <!-- not extracted -->
    <link rel="stylesheet" href="http://example.com/external.css">
  </head>
</html>`;

  let finalDOM;
  let inline;
  let preserve;

  before(function() {
    const stylesheets = new Stylesheets({ directory: 'test' });
    return parseHTMLAsync(HTML)
      .then(function(dom) {
        return extractAsync(dom, stylesheets);
      })
      .then(function(result) {
        finalDOM  = result.dom;
        inline    = result.inline;
        preserve  = result.preserve;
      });
  });

  it('should remove all style elements', function() {
    const styleElements = CSSselect.selectAll('style', finalDOM);
    assert.equal(styleElements.length, 0);
  });

  it('should remove only external relative stylesheets', function() {
    const styleElements = CSSselect.selectAll('link[rel~="stylesheet"]', finalDOM);
    assert.equal(styleElements.length, 1);
    const href = styleElements[0].attribs.href;
    assert( href.startsWith('http://') );
  });

  it('should collect all rules', function() {
    assert.equal(inline.length, 3);
  });

  it('should collect inline rules with static selector', function() {
    const names = ruleNames(inline);
    assert(~names.indexOf('h2'));
    assert(~names.indexOf('h3'));
  });

  it('should not collect inline rules with dynamic selector', function() {
    const names = ruleNames(inline);
    assert(names.indexOf('h2:hover') < 0);
  });

  it('should collect inline rules in document order', function() {
    const names = ruleNames( inline.slice(2) );
    assert.equal(names, 'body');
  });

  it('should collect inline rules in stylesheet order', function() {
    const names = ruleNames( inline.slice(0, 2) );
    assert.deepEqual(names, [ 'h2', 'h3' ]);
  });

  it('should collect preserve rules with dynamic selector', function() {
    const names = ruleNames(preserve);
    assert(~names.indexOf('h2:hover'));
  });

  it('should collect preserve rules with media queries', function() {
    const names = ruleNames(preserve);
    assert(~names.indexOf('@media'));
  });

  it('should not collect preserve rules with static selector', function() {
    const names = ruleNames(preserve);
    assert(names.indexOf('h2') < 0);
  });

  it('should collect preserved rules in stylesheet order', function() {
    const names = ruleNames(preserve);
    assert.deepEqual(names, [ '@media', 'h2:hover' ]);
  });

});


describe('Invalid CSS', function() {

  const HTML = `
<html>
  <head>
    <style>
      @media screen {
        h1 { color: red; }
    </style>
  </head>
</html>
  `;

  let parseError;

  before(function() {
    const stylesheets = new Stylesheets();
    return parseHTMLAsync(HTML)
      .then(function(dom) {
        return extractAsync(dom, stylesheets);
      })
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

  const HTML = `
<html>
  <head>
    <link rel="stylesheet" href="not_found">
  </head>
</html>
  `;

  let loadError;

  before(function() {
    const stylesheets = new Stylesheets({ directory: 'test' });
    return parseHTMLAsync(HTML)
      .then(function(dom) {
        return extractAsync(dom, stylesheets);
      })
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


