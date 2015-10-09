'use strict';
const assert    = require('assert');
const Context   = require('../lib/context');
const domToHTML = require('../lib/dom_to_html');
const File      = require('fs');
const parseHTML = require('../lib/parse_html');


describe('DOM to HTML', function() {

  function roundTrip(html) {
    const context     = new Context({ html });
    const parsed      = parseHTML(context);
    const serialized  = domToHTML(parsed);
    return serialized.html;
  }


  describe('a regular attribute', function() {

    it('should produce attribute name equals quoted value', function() {
      const html      = '<input value="">';
      const expected  = '<input value="">';
      const actual    = roundTrip(html);
      assert.equal(actual, expected);
    });

    it('should quote attribute value (even if not quoted)', function() {
      const html      = '<input value=foobar>';
      const expected  = '<input value="foobar">';
      const actual    = roundTrip(html);
      assert.equal(actual, expected);
    });

    it('should encode double quotes in attribute value', function() {
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

    it('should encode any entities from source document', function() {
      const html      = '<input value="foo&quot;&amp;&gt;bar">';
      const expected  = '<input value="foo&quot;&amp;&gt;bar">';
      const actual    = roundTrip(html);
      assert.equal(actual, expected);
    });

  });


  describe('a boolean attribute', function() {

    describe('with value', function() {
      it('should produce attribute name with no value', function() {
        const html      = '<input autofocus=autofocus>';
        const expected  = '<input autofocus>';
        const actual    = roundTrip(html);
        assert.equal(actual, expected);
      });
    });

    describe('without value', function() {
      it('should produce attribute name with no value', function() {
        const html      = '<input autofocus>';
        const expected  = '<input autofocus>';
        const actual    = roundTrip(html);
        assert.equal(actual, expected);
      });
    });

  });


  describe('an element', function() {

    it('should produce all attributes', function() {
      const html      = '<input class="input-lg" name="name" value="Assaf" autofocus required>';
      const expected  = html;
      const actual    = roundTrip(html);
      assert.equal(actual, expected);
    });

    describe('(void)', function() {
      it('should produce only open tag', function() {
        const html      = '<input autofocus>';
        const expected  = html;
        const actual    = roundTrip(html);
        assert.equal(actual, expected);
      });
    });

    describe('(empty)', function() {
      it('should produce open and close tags', function() {
        const html      = '<textarea></textarea>';
        const expected  = html;
        const actual    = roundTrip(html);
        assert.equal(actual, expected);
      });
    });

    describe('(complex content)', function() {
      it('should produce element with contents', function() {
        const html      = '<p>So <b>bold</b> in here!<br></p>';
        const expected  = html;
        const actual    = roundTrip(html);
        assert.equal(actual, expected);
      });
    });

    describe('(XML in HTML, empty)', function() {
      it('should produce self-closing tag', function() {
        const html      = '<svg autofocus></svg>';
        const expected  = '<svg autofocus />';
        const actual    = roundTrip(html);
        assert.equal(actual, expected);
      });
    });

    describe('(XML in HTML)', function() {
      it('should produce element and contents', function() {
        const html      = '<svg><rect /><path /></svg>';
        const expected  = html;
        const actual    = roundTrip(html);
        assert.equal(actual, expected);
      });
    });

  });


  describe('a declaration', function() {
    it('should produce itself', function() {
      const html      = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html><body>Hi</body></html>';
      const expected  = html;
      const actual    = roundTrip(html);
      assert.equal(actual, expected);
    });
  });


  describe('any text content', function() {
    it('should encode HTML entities', function() {
      const html      = '<p>This "quotes" & apostrophe\'s &lt;3 </p>';
      const expected  = '<p>This &quot;quotes&quot; &amp; apostrophe&apos;s &lt;3 </p>';
      const actual    = roundTrip(html);
      assert.equal(actual, expected);
    });
  });


  describe('a style element', function() {
    it('should not encode content', function() {
      const html      = '<style>.foo { font-family: "Helvetica"; }</style>';
      const expected  = html;
      const actual    = roundTrip(html);
      assert.equal(actual, expected);
    });
  });


  describe('a script element', function() {
    it('should not encode content', function() {
      const html      = '<script>alert("Hi there");}</script>';
      const expected  = html;
      const actual    = roundTrip(html);
      assert.equal(actual, expected);
    });
  });


  describe('an XHTML document', function() {
    it('should produce itself', function() {
      const xhtml     = File.readFileSync(`${__dirname}/xhtml.html`, 'utf8');
      const expected  = xhtml;
      const actual    = roundTrip(xhtml);
      assert.equal(actual, expected);
    });
  });

  describe('XHTML mode', function() {
    describe('a regular element with no content', function() {
      it('should not use the </> shorthand', function() {
        const html      = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html><title></title></html>';
        const expected  = html;
        const actual    = roundTrip(html);
        assert.equal(actual, expected);
      });
    });

    describe('an empty element with no content', function() {
      it('should use the </> shorthand', function() {
        const html      = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html><br /></html>';
        const expected  = html;
        const actual    = roundTrip(html);
        assert.equal(actual, expected);
      });
    });
  });

});

