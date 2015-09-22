// Processing context for the pipeline.

'use strict';
const Immutable = require('immutable');


module.exports = Immutable.Record({
  // Caching of compiled styleshees
  cache:    null,
  // Resolves external stylesheets from file system
  resolve:  null,
  // HTML source
  html:     null,
  // htmlparser2 DOM; mutated between steps
  dom:      null,
  // List of CSS rules
  rules:    null,
  // Any warnings reported during processing
  warnings: null,
  // True to compress output
  compress: false
});

