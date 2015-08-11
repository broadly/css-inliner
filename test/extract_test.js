'use strict';
const assert          = require('assert');
const CSSselect       = require('css-select');
const extractAsync    = require('../lib/extract_stylesheets');
const parseHTMLAsync  = require('../lib/parse_html');
const Stylesheets     = require('../lib/stylesheets');


// [ Rule ] -> [ string ]
function ruleNames(rules) {
  return rules.map(function(rule) {
    return rule.name || rule.selector;
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
    </style>
    <link rel="stylesheet" href="blue_body.css">
    <!-- not extracted -->
    <link rel="stylesheet" href="http://example.com/external.css">
  </head>
</html>
  `;

  let finalDOM;
  let allRules;

  before(function() {
    const stylesheets = new Stylesheets({ baseDir: __dirname });
    return parseHTMLAsync(HTML)
      .then(function(dom) {
        return extractAsync(dom, stylesheets);
      })
      .then(function(result) {
        finalDOM = result.dom;
        allRules = result.rules;
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
    assert.equal(allRules.length, 3);
  });

  it('should collect media @ rules', function() {
    const mediaRule = allRules[0];
    assert.equal(mediaRule.name,    'media');
    assert.equal(mediaRule.params,  'screen');
  });

  it('should collect rules in document order', function() {
    const external = ruleNames( allRules.slice(2) );
    assert.equal(external, 'body');
  });

  it('should collect rules in stylesheet order', function() {
    const inline = ruleNames( allRules.slice(0, 2) );
    assert.deepEqual(inline, [ 'media', 'h2' ]);
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
    const stylesheets = new Stylesheets({ baseDir: __dirname });
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


