// Processing context for the pipeline.
//
// We process a document by running it through several stages (functions), we
// call each function with a context, and it returns/resolves to a new context.
//
// Contexts are immutable, and so are their properties, with the exception of
// the DOM which is modified in place.

'use strict';
const Immutable = require('immutable');


module.exports = Immutable.Record({
  // Caching of compiled stylesheets
  cache:    null,
  // HTML source, then HTML output
  html:     null,
  // Filename to report when logging
  filename: null,
  // Reference to the inliner itself
  inliner:  null,
  // Stashed template tags
  stashed:  null,
  // htmlparser2 DOM; mutated between stages
  dom:      null,
  // List of CSS rules, updated (not mutated) between stages
  rules:    null,
  // Any warnings reported during processing
  warnings: null,
  // True to compress output
  compress: false
});

