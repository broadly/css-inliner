'use strict';
const assert      = require('assert');
const Stylesheets = require('../lib/stylesheets');


describe('File resolver', function() {

  const resolve = Stylesheets.fileResolver('/home/headset');

  it('should resolve relative filename', function() {
    const filename = resolve('left');
    assert.equal(filename, '/home/headset/left');
  });

  it('should resolve absolute filename as relative filename', function() {
    const filename = resolve('/right');
    assert.equal(filename, '/home/headset/right');
  });

  it('should ignore traversal up the tree', function() {
    const filename = resolve('../left/../../right');
    assert.equal(filename, '/home/headset/right');
  });

  it('should resolve filename with directory and extension', function() {
    const filename = resolve('left/right.css');
    assert.equal(filename, '/home/headset/left/right.css');
  });


  describe('with no base directory', function() {

    const noBaseDir = Stylesheets.fileResolver();

    it('should resolve relative to current working directory', function() {
      const filename = noBaseDir('left');
      assert.equal(filename, `${process.cwd()}/left`);
    });
  });

  describe('with dot base directory', function() {

    const dotBaseDir = Stylesheets.fileResolver('.');

    it('should resolve relative to current working directory', function() {
      const filename = dotBaseDir('left');
      assert.equal(filename, `${process.cwd()}/left`);
    });
  });

});


describe('URL resolver', function() {

  const resolve = Stylesheets.urlResolver('http://example.com/headset');

  it('should resolve relative path', function() {
    const url = resolve('left');
    assert.equal(url, 'http://example.com/headset/left');
  });

  it('should resolve absolute path as relative path', function() {
    const url = resolve('/right');
    assert.equal(url, 'http://example.com/headset/right');
  });

  it('should ignore traversal up the tree', function() {
    const url = resolve('../left/../../right');
    assert.equal(url, 'http://example.com/headset/right');
  });

  it('should resolve nested path with extension', function() {
    const url = resolve('left/right.css');
    assert.equal(url, 'http://example.com/headset/left/right.css');
  });

  it('should resolve URL as if it was a path', function() {
    const url = resolve('http://left.io/right.css');
    assert.equal(url, 'http://example.com/headset/right.css');
  });


  describe('with trailing slash', function() {

    const trailing = Stylesheets.urlResolver('http://example.com/headset/');

    it('should resolve relative path', function() {
      const url = trailing('left');
      assert.equal(url, 'http://example.com/headset/left');
    });

    it('should resolve absolute path as relative path', function() {
      const url = trailing('/right');
      assert.equal(url, 'http://example.com/headset/right');
    });

  });


  describe('with no protocol', function() {

    it('shold throw an error', function() {
      assert.throws(function() {
        Stylesheets.urlResolver('//example.com/headset/');
      });
    });

  });

  describe('with no hostname', function() {

    it('shold throw an error', function() {
      assert.throws(function() {
        Stylesheets.urlResolver('http:///example.com/headset/');
      });
    });

  });

});


describe('Stylesheets', function() {

  describe('with base URL', function() {

    const stylesheets = new Stylesheets({ baseURL: 'http://example.com/headset' });

    it('should load stylesheets from base directory', function() {
      assert.equal(stylesheets.resolve('left'), 'http://example.com/headset/left');
    });

  });

  describe('with base directory', function() {

    const stylesheets = new Stylesheets({ baseDir: '/home/headset' });

    it('should load stylesheets from base directory', function() {
      assert.equal(stylesheets.resolve('left'), '/home/headset/left');
    });

  });

  describe('with resolver', function() {

    const stylesheets = new Stylesheets({
      resolve(path) {
        return path.split('').reverse().join('');
      }
    });

    it('should load stylesheets from base directory', function() {
      assert.equal(stylesheets.resolve('left'), 'tfel');
    });

  });

  describe('with default option', function() {

    const stylesheets = new Stylesheets();

    it('should load stylesheets from base directory', function() {
      assert.equal(stylesheets.resolve('left'), `${process.cwd()}/left`);
    });

  });

});


describe('Stylesheets cache', function() {

  const stylesheets = new Stylesheets();
  const css         = `body { color: red }`;
  const results     = [];

  function cacheCSS() {
    return stylesheets
      .cache(css)
      .then(function(result) {
        results.push(result);
      });
  }

  before(cacheCSS);

  it('should return the result', function() {
    assert(results[0].root);
  });

  it('should parse the CSS', function() {
    const root = results[0].root;
    const body = root.nodes[0];
    assert.equal(body.selector, 'body');
    const decl = body.nodes[0];
    assert.equal(decl.prop, 'color');
    assert.equal(decl.value, 'red');
  });

  describe('repeat get', function() {

    before(function() {
      assert.equal(results.length, 1);
    });
    before(cacheCSS);

    it('should return cached result', function() {
      assert.equal(results[0], results[1]);
    });

  });

});


describe('Stylesheets load', function() {

  const stylesheets = new Stylesheets();
  const results     = [];

  function cacheCSS() {
    return stylesheets
      .load('test/blue_body.css')
      .then(function(result) {
        results.push(result);
      });
  }

  before(cacheCSS);

  it('should return the result', function() {
    assert(results[0].root);
  });

  it('should parse the CSS', function() {
    const root = results[0].root;
    const body = root.nodes[0];
    assert.equal(body.selector, 'body');
    const decl = body.nodes[0];
    assert.equal(decl.prop, 'color');
    assert.equal(decl.value, 'blue');
  });

  describe('repeat get', function() {

    before(function() {
      assert.equal(results.length, 1);
    });
    before(cacheCSS);

    it('should return cached result', function() {
      assert.equal(results[0], results[1]);
    });

  });

});

