'use strict';
const assert        = require('assert');
const CSSInliner    = require('../');


const SOURCE = `
<html>
  <head>
    <title>Hello World!</title>
    <style>
      body {
        font:  Helvetica;
      }
      @media screen {
        body {
          font-size: 12pt;
        }
      }
      body, h1 {
        font-weight: bold;
      }
      h1:hover {
        text-decoration: underline;
      }
    </style>
    <link rel="stylesheet" href="blue_body.css">
    <link rel="stylesheet" href="http://example.com/style.css">
  </head>
  <body>
    <h1>Hello World!</h1>
  </body>
</html>
`;

const EXPECTED = `
<html>
  <head><style>body {
      font:  Helvetica;
    };@media screen {
      body {
        font-size: 12pt;
      }
    };body, h1 {
      font-weight: bold;
    };h1:hover {
      text-decoration: underline;
    };body {
      color: blue;
    }</style>
    <title>Hello World!</title>
    <link rel="stylesheet" href="http://example.com/style.css">
  </head>
  <body>
    <h1>Hello World!</h1>
  </body>
</html>
`;


describe('Critical CSS', function() {

  let result;

  before(function() {
    const inliner = new CSSInliner({ directory: __dirname });
    return inliner.criticalAsync(SOURCE)
      .then(function(html) {
        result = html;
      });
  });

  it('should add CSS styles at top of document', function() {
    const regexp = /<head><style>(.|\n)*<\/style>(.|\n)*<\/head>/;
    assert( regexp.test(result) );
  });

  it('should include media query in critical CSS', function() {
    const regexp = /<head><style>(.|\n)*@media screen\s+{\s+body\s+{/;
    assert( regexp.test(result) );
  });

  it('should include pseudo element selectors in critical CSS', function() {
    const regexp = /<head><style>(.|\n)*h1:hover\s+{\s+text-decoration/;
    assert( regexp.test(result) );
  });

  it('should include regular selectors in critical CSS', function() {
    const regexp = /<head><style>(.|\n)*h1\s+{\s+font-weight/;
    assert( regexp.test(result) );
  });

  it('should remove other style elements', function() {
    const regexp = /<style>(.|\n)*?<\/style>/g;
    let   count = 0;
    result.replace(regexp, function(match) {
      ++count;
      assert(count === 1, match);
    });
  });

  it('should keep external link reference', function() {
    const regexp = /<link rel="stylesheet" href="(.*)">/g;
    result.replace(regexp, function(match, url) {
      assert.equal(url, 'http://example.com/style.css');
    });
  });

  it('should leave body intact', function() {
    const regexp = /<body>\s+<h1>Hello World!<\/h1>\s+<\/body>/;
    assert( regexp.test(result) );
  });


  it('should match expected output', function() {
    assert.equal(result.replace(/\s+/g, ' '), EXPECTED.replace(/\s+/g, ' '));
  });

});

