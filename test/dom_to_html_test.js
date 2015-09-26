'use strict';
const assert    = require('assert');
const Context   = require('../lib/context');
const domToHTML = require('../lib/dom_to_html');
const parseHTML = require('../lib/parse_html');


describe('DOM to HTML', function() {

  function roundTrip(html) {
    const context     = new Context({ html });
    const parsed      = parseHTML(context);
    const serialized  = domToHTML(parsed);
    return serialized.html;
  }


  describe('regular attribute', function() {

    it('should produce attribute name and value', function() {
      const html      = '<input value="">';
      const expected  = '<input value="">';
      const actual    = roundTrip(html);
      assert.equal(actual, expected);
    });

    it('should quote attribute value', function() {
      const html      = '<input value=foobar>';
      const expected  = '<input value="foobar">';
      const actual    = roundTrip(html);
      assert.equal(actual, expected);
    });

    it('should encode quotes in attribute value', function() {
      const html      = '<input value=\'foo"bar\'>';
      const expected  = '<input value="foo&quot;bar">';
      const actual    = roundTrip(html);
      assert.equal(actual, expected);
    });

    it('should encode ampersands in attribute value', function() {
      const html      = '<input value="foo&bar">';
      const expected  = '<input value="foo&amp;bar">';
      const actual    = roundTrip(html);
      assert.equal(actual, expected);
    });

    it('should not encode single quotes in attribute value', function() {
      const html      = '<input value="foo\'bar">';
      const expected  = html;
      const actual    = roundTrip(html);
      assert.equal(actual, expected);
    });

    it('should preserve encoded attribute value', function() {
      const html      = '<input value="foo&quot;&amp;&gt;bar">';
      const expected  = '<input value="foo&quot;&amp;&gt;bar">';
      const actual    = roundTrip(html);
      assert.equal(actual, expected);
    });

  });


  describe('boolean attribute', function() {

    describe('with value', function() {
      it('should produce empty attribute name', function() {
        const html      = '<input autofocus=autofocus>';
        const expected  = '<input autofocus>';
        const actual    = roundTrip(html);
        assert.equal(actual, expected);
      });
    });

    describe('without value', function() {
      it('should produce empty attribute name', function() {
        const html      = '<input autofocus>';
        const expected  = '<input autofocus>';
        const actual    = roundTrip(html);
        assert.equal(actual, expected);
      });
    });

  });


  describe('element', function() {

    it('should produce all attributes', function() {
      const html      = '<input class="input-lg" name="name" value="Assaf" autofocus required>';
      const expected  = html;
      const actual    = roundTrip(html);
      assert.equal(actual, expected);
    });

    describe('void', function() {
      it('should produce only open tag', function() {
        const html      = '<input autofocus>';
        const expected  = html;
        const actual    = roundTrip(html);
        assert.equal(actual, expected);
      });
    });

    describe('empty', function() {
      it('should produce open and close tags', function() {
        const html      = '<textarea></textarea>';
        const expected  = html;
        const actual    = roundTrip(html);
        assert.equal(actual, expected);
      });
    });

    describe('complex content', function() {
      it('should produce element and contents', function() {
        const html      = '<p>So <b>bold</b> in here!<br></p>';
        const expected  = html;
        const actual    = roundTrip(html);
        assert.equal(actual, expected);
      });
    });

    describe('empty (XML)', function() {
      it('should produce self-closing tag', function() {
        const html      = '<svg autofocus></svg>';
        const expected  = '<svg autofocus/>';
        const actual    = roundTrip(html);
        assert.equal(actual, expected);
      });
    });

    describe('complex XML', function() {
      it('should produce element and contents', function() {
        const html      = '<svg><rect/><path/></svg>';
        const expected  = html;
        const actual    = roundTrip(html);
        assert.equal(actual, expected);
      });
    });

  });


  describe('declaration', function() {
    it('should preserve in output', function() {
      const html      = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html></html>';
      const expected  = html;
      const actual    = roundTrip(html);
      assert.equal(actual, expected);
    });
  });


  describe('text content', function() {
    it('should encode as necessary', function() {
      const html      = '<p>This "quotes" & apostrophe\'s &lt;3 </p>';
      const expected  = '<p>This &quot;quotes&quot; &amp; apostrophe&apos;s &lt;3 </p>';
      const actual    = roundTrip(html);
      assert.equal(actual, expected);
    });
  });


  describe('style element', function() {
    it('should not encode content', function() {
      const html      = '<style>.foo { font-family: "Helvetica"; }</style>';
      const expected  = html;
      const actual    = roundTrip(html);
      assert.equal(actual, expected);
    });
  });


  describe('script element', function() {
    it('should not encode content', function() {
      const html      = '<script>alert("Hi there");}</script>';
      const expected  = html;
      const actual    = roundTrip(html);
      assert.equal(actual, expected);
    });
  });

});
