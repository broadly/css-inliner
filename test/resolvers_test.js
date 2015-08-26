const assert        = require('assert');
const fileResolver  = require('../lib/resolvers').fileResolver;


describe('File resolver', function() {

  const resolve       = fileResolver('/var/www');

  it('should resolve /foo.css to dir/foo.css', function() {
    assert.equal( resolve('/foo.css'), '/var/www/foo.css');
  });

  it('should resolve foo.css to dir/doo.css', function() {
    assert.equal( resolve('foo.css'), '/var/www/foo.css');
  });

  it('should resolve ../../foo.css to dir/foo.css', function() {
    assert.equal( resolve('../../foo.css'), '/var/www/foo.css');
  });

  it('should not resolve //foo.css', function() {
    assert.equal( resolve('//foo.css'), null);
  });

  it('should not resolve http://foo.css', function() {
    assert.equal( resolve('http://foo.css'), null);
  });

  it('should resolve " /foo.css " to dir/foo.css', function() {
    assert.equal( resolve(' /foo.css '), '/var/www/foo.css');
  });

});
