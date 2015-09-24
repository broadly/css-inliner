'use strict';
const assert    = require('assert');
const loadFrom  = require('../lib/load_from');


describe('Load resource', function() {

  const load = loadFrom(__dirname);

  function loadsCSSFrom(url) {
    return load(url)
      .then(function(css) {
        assert.equal(css.toString(), '.foo { }\n');
      });
  }

  it('should resolve /load_from.css to {directory}/foo.css', function() {
    return loadsCSSFrom('/load_from.css');
  });

  it('should resolve foo.css to {directory}/foo.css', function() {
    return loadsCSSFrom('load_from.css');
  });

  it('should resolve ../../foo.css to {directory}/foo.css', function() {
    return loadsCSSFrom('../../load_from.css');
  });

  it('should resolve " ../foo.css " to {directory}/foo.css', function() {
    return loadsCSSFrom(' ../load_from.css ');
  });

  it('should resolve //foo.css to {directory}/foo.css', function() {
    return loadsCSSFrom('//load_from.css ');
  });

});
