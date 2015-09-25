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
    const name  = pair[0].trim().replace(/-\w/, m => m.slice(1).toUpperCase());
    const value = pair[1].trim();
    assert.equal(object[name], undefined, `Property ${name} appears twice in style attribute`);
    object[name] = value;
    return object;
  }, {});
  return properties;
}


describe('Apply inline', function() {

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


  describe('Element with matching rule', function() {

    const css = `
      p {
        color: red;
        border: 1px solid blue;
        outline: none !important;
      }
    `;

    describe('no inline properties', function() {

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

      it('should add styles from rule', function() {
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

      it('should preserve inline styles', function() {
        const p           = CSSselect.selectOne('p', dom);
        const properties  = parseStyle(p);
        assert.equal(properties.font, 'courier');
      });

      it('should keep inline styles (higher specificity)', function() {
        const p           = CSSselect.selectOne('p', dom);
        const properties  = parseStyle(p);
        assert.equal(properties.color, 'green');
      });

      it('should add styles from rule', function() {
        const p           = CSSselect.selectOne('p', dom);
        const properties  = parseStyle(p);
        assert.equal(properties.border, '1px solid blue');
      });

      it('should add styles from rule (if important)', function() {
        const p           = CSSselect.selectOne('p', dom);
        const properties  = parseStyle(p);
        assert.equal(properties.outline, 'none');
      });

    });


  });


  describe('Element with several matching rule', function() {

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


  describe('Element with no matching rule', function() {

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

      it('should preserve inline styles', function() {
        const p          = CSSselect.selectOne('p', dom);
        const properties = parseStyle(p);
        assert.equal(properties.color, 'green');
      });

      it('should not add new inline styles', function() {
        const p          = CSSselect.selectOne('p', dom);
        const properties = parseStyle(p);
        assert.equal(Object.keys(properties).length, 1);
      });

    });

  });


  describe('Element tree', function() {

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

    it('should apply style to div element', function() {
      const body       = CSSselect.selectOne('body', dom);
      const properties = parseStyle(body);
      assert.equal(properties.color, 'red');
    });

    it('should apply style to h1 element', function() {
      const h1         = CSSselect.selectOne('h1', dom);
      const properties = parseStyle(h1);
      assert.equal(properties.textDecoration, 'underline');
    });

    it('should apply style to p element', function() {
      const p          = CSSselect.selectOne('p', dom);
      const properties = parseStyle(p);
      assert.equal(properties.fontSize, '1.2em');
    });

  });


});

