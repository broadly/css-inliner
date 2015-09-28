// Extract tags from Handlebar templates.
//
// If you need to inline Handlebar templates, do this:
//
//   const template = CSSInliner.handlebars;
//   const inliner  = new CSSInliner({ template });

'use strict';


// Given the source for an Handlebars template, find and return all the
// Handlebars tags contained there (expressions, blocks, comments, etc)
module.exports = function getTemplateTags(template) {
  const statements  = parseForLocation(template);
  const tagsOnly    = statements.filter(isTemplateTag);
  const locations   = tagsOnly.map(statement => [ statement.loc.start.column, statement.loc.end.column ]);
  const hbsTags     = locations.map(location => template.slice(location[0], location[1]) );
  return hbsTags;
};


// template -> [statement]
function parseForLocation(template) {
  // Lazy load since Handlebars is an optional dependency
  const Handlebars = require('handlebars');

  // Handlebars parser gives us position information as line/column, so we turn
  // entire template into single line, and we treat column as offset
  const singleLine  = template.replace(/\n/g, ' ');

  // Handlebars splits document into these statements: content, mustache, blocks, partials, etc
  const statements  = Handlebars.parse(singleLine).body;
  return statements;
}


// Is this a Handlebars template tag (true) or HTML contents (false)
function isTemplateTag(statement) {
  return statement.type !== 'ContentStatement';
}

