'use strict';
const inlineRules = require('../lib/inline_rules');
const assert      = require('assert');
const CSSselect   = require('css-select');
const Cache       = require('../lib/cache');
const Context     = require('../lib/context');
const parseHTML   = require('../lib/parse_html');


// Given a DOM element, parses its style attribute and returns object literal
// with CSS properties.  Names converted, so font-style becomes fontStyle.
function parseStyle(element) {
  const attribute   = element.attribs.style;
  const pairs       = attribute.split(/;/).map(property => property.split(':'));
  const properties  = pairs.reduce((object, pair)=> {
    // font-color -> fontColor
    const name  = pair[0].trim().replace(/-(\w)/, titlize);
    const value = pair[1].trim();
    assert(!object[name], `Property ${name} appears twice in style attribute`);
    object[name] = value;
    return object;
  }, {});
  return properties;
}

function titlize(match, word) {
  return word.toUpperCase();
}

// Parses CSS stylesheet, applies to DOM, returns promise.
//
// (css, dom) -> promise()
function applyCSS(html, css) {
  const cache   = new Cache();
  const context = new Context({ html });
  const parsed  = parseHTML(context);
  return cache.compileAsync(css)
    .then(function(result) {
      const withRules = parsed.set('rules', result.rules);
      const inlined   = inlineRules(withRules);
      return inlined.dom;
    });
}



describe('Apply rules inline', function() {

  describe('to element with matching rule', function() {

    const css = `
      p {
        color: red;
        border: 1px solid blue;
        outline: none !important;
      }
    `;

    describe('and no inline properties', function() {

      const html = `
        <html>
          <body>
            <p>This has no inline properties</p>
          </body>
        </html>
      `;

      let dom;

      before(function() {
        return applyCSS(html, css)
          .then(function(result) {
            dom = result;
          });
      });

      it('should set style attribute', function() {
        const p = CSSselect.selectOne('p', dom);
        assert(p.attribs.style);
      });

      it('should add all properties from rule', function() {
        const p           = CSSselect.selectOne('p', dom);
        const properties  = parseStyle(p);
        assert.equal(properties.color, 'red');
        assert.equal(properties.border, '1px solid blue');
        assert.equal(properties.outline, 'none');
      });

    });


    describe('with inline properties', function() {

      const html = `
        <html>
          <body>
            <p style="color:green;font:courier;outline:1px dashed blue">This has inline properties</p>
          </body>
        </html>
      `;

      let dom;

      before(function() {
        return applyCSS(html, css)
          .then(function(result) {
            dom = result;
          });
      });

      describe('property on element, not in rule', function() {
        it('should keep existing property', function() {
          const p           = CSSselect.selectOne('p', dom);
          const properties  = parseStyle(p);
          assert.equal(properties.font, 'courier');
        });
      });

      describe('property on element and in rule', function() {
        it('should keep existing property (higher specificity)', function() {
          const p           = CSSselect.selectOne('p', dom);
          const properties  = parseStyle(p);
          assert.equal(properties.color, 'green');
        });
      });

      describe('property in rule, not on element', function() {
        it('should add property from rule', function() {
          const p           = CSSselect.selectOne('p', dom);
          const properties  = parseStyle(p);
          assert.equal(properties.border, '1px solid blue');
        });
      });

      describe('property in rule is important', function() {
        it('should add property from rule (important trumps specificity)', function() {
          const p           = CSSselect.selectOne('p', dom);
          const properties  = parseStyle(p);
          assert.equal(properties.outline, 'none');
        });
      });

    });


  });


  describe('to element with several matching rules', function() {

    const css = `
      p#foo {
        color: red;
      }
      p {
        color: blue;            /* ignored, previous rule has higher specificity */
        border: 1px solid blue; /* ignored, next rule takes precedence */
      }
      p {
        border: 1px solid red;
      }
    `;

    const html = `
      <html>
        <body>
          <p id="foo">This has border</p>
        </body>
      </html>
    `;

    let dom;

    before(function() {
      return applyCSS(html, css)
        .then(function(result) {
          dom = result;
        });
    });

    it('should pick property with highest specificity', function() {
      const p           = CSSselect.selectOne('p', dom);
      const properties  = parseStyle(p);
      assert.equal(properties.color, 'red');
    });

    it('should pick later of two properties with same specificity', function() {
      const p           = CSSselect.selectOne('p', dom);
      const properties  = parseStyle(p);
      assert.equal(properties.border, '1px solid red');
    });

  });


  describe('to element with no matching rules', function() {

    const css = `p.foo { color: red; }`;

    describe('no inline properties', function() {

      const html = `
      <html>
        <body>
          <p>This is unstyled</p>
        </body>
      </html>
      `;

      let dom;

      before(function() {
        return applyCSS(html, css)
          .then(function(result) {
            dom = result;
          });
      });

      it('should not set style attribute', function() {
        const p = CSSselect.selectOne('p', dom);
        assert.equal(p.attribs.style, undefined);
      });

    });


    describe('with inline properties', function() {

      const html = `
      <html>
        <body>
          <p style="color:green">This is green</p>
        </body>
      </html>
      `;

      let dom;

      before(function() {
        return applyCSS(html, css)
          .then(function(result) {
            dom = result;
          });
      });

      it('should keep existing properties', function() {
        const p          = CSSselect.selectOne('p', dom);
        const properties = parseStyle(p);
        assert.equal(properties.color, 'green');
      });

      it('should not add new properties', function() {
        const p          = CSSselect.selectOne('p', dom);
        const properties = parseStyle(p);
        assert.equal(Object.keys(properties).length, 1);
      });

    });

  });


  describe('to element tree', function() {

    const css   = `
      body { color: red; }
      body h1 { text-decoration: underline; }
      body > p { font-size: 1.2em; }
    `;
    const html  = `
    <html>
      <body>
        <h1>Hello</h1>
        <p>Nice to meet you</p>
      </body>
    </html>
    `;

    let dom;

    before(function() {
      return applyCSS(html, css)
        .then(function(result) {
          dom = result;
        });
    });

    describe('rule with element selector', function() {
      it('should apply to element', function() {
        const body       = CSSselect.selectOne('body', dom);
        const properties = parseStyle(body);
        assert.equal(properties.color, 'red');
      });
    });

    describe('rule with descendant selector', function() {
      it('should apply to descendant element', function() {
        const h1         = CSSselect.selectOne('h1', dom);
        const properties = parseStyle(h1);
        assert.equal(properties.textDecoration, 'underline');
      });
    });

    describe('rule with child selector', function() {
      it('should apply to child element', function() {
        const p          = CSSselect.selectOne('p', dom);
        const properties = parseStyle(p);
        assert.equal(properties.fontSize, '1.2em');
      });
    });

  });

  describe('with many declarations', function() {

    const css   = `
      a {
        font-family:      sans-serif;
        font-size:        14px;
        line-height:      1;
        margin:           0;
        padding:          0;
      }
      div.button a {
        background:       #2ba6cb;
      }
      .buttons div.button a {
        background-color: #337ab7;
        border-color:     #2e6da4;
        color:            #fff;
      }
    `;

    let dom;

    describe('an element with no style attribute', function() {
      const html  = `
      <html>
        <body>
          <div class="buttons">
            <div class="button">
              <a>Click me</a>
            </div>
          </div>
        </body>
      </html>
      `;

      before(function() {
        return applyCSS(html, css)
          .then(function(result) {
            dom = result;
          });
      });

      it('should keep declarations in order', function() {
        const link            = CSSselect.selectOne('a', dom);
        const background      = link.attribs.style.indexOf('background:');
        const backgroundColor = link.attribs.style.indexOf('background-color:');

        assert(background      > -1);
        assert(backgroundColor > -1);
        assert(backgroundColor > background);
      });
    });

    describe('an element with a style attribute', function() {
      const html  = `
      <html>
        <body>
          <div class="buttons">
            <div class="button">
              <a style='display: block'>Click me</a>
            </div>
          </div>
        </body>
      </html>
      `;

      before(function() {
        return applyCSS(html, css)
          .then(function(result) {
            dom = result;
          });
      });

      it('should keep declarations in order', function() {
        const link            = CSSselect.selectOne('a', dom);
        const background      = link.attribs.style.indexOf('background:');
        const backgroundColor = link.attribs.style.indexOf('background-color:');

        assert(background      > -1);
        assert(backgroundColor > -1);
        assert(backgroundColor > background);
      });
    });
  });

});

