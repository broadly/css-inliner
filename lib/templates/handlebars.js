// Extract tags from Handlebar templates.
//
// If you need to inline Handlebar templates, do this:
//
//   const retag = require('css-inliner/handlebars');
//   const inliner = new CSSInliner({ retag });

'use strict';
const Handlebars = require('handlebars');


// Given the source for an Handlebars template, find and return all the
// Handlebars tags contained there (expressions, blocks, comments, etc)
module.exports = function getTemplateTags(template) {

  // Handlebars parser gives us position information as line/column, so we turn
  // entire template into single line, and we treat column as offset
  const singleLine  = template.replace(/\n/g, ' ');

  // Handlebars splits document into these statements: content, mustache, blocks, partials, etc
  const statements  = Handlebars.parse(singleLine).body;

  const notContent  = statements.filter(part => part.type !== 'ContentStatement');
  const locations   = notContent.map(statement => [ statement.loc.start.column, statement.loc.end.column ]);
  const hbsTags     = locations.map(location => template.slice(location[0], location[1]) );
  return hbsTags;
};

