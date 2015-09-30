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
  const locations   = extractLocations(statements);
  const hbsTags     = locations.map(location => template.slice(location[0], location[1]));
  return hbsTags;
};


// Given a Handlebars AST, recursively extracts location offsets of actual
// Handlebars code.
function extractLocations(statements) {
  const locations = [];

  for (let statement of statements) {
    if (statement.type === 'ContentStatement') {
      if (statement.value.startsWith('{{'))
        // Node looks like raw text, but is actually escaped Handlebars.
        // Extract as is with its preceding backslash.
        locations.push([statement.loc.start.column - 1, statement.loc.end.column]);
    }
    else if (statement.program) {
      // BlockStatement, MustacheStatement, basically a block with code inside it.
      // We extract the open and close tags and recurse over the block's body.
      let start = statement.loc.start.column;
      let end;

      if (statement.hash)
        end = statement.hash.loc.end.column;
      else if (statement.params.length > 0)
        end = statement.params[statement.params.length - 1].loc.end.column;

      locations.push([start, end]);
      locations.push.apply(locations, extractLocations(statement.program.body));
    }
    else
      // Any other piece of Handlebars code without a nested block.
      locations.push([statement.loc.start.column, statement.loc.end.column]);
  }

  return locations;
}


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
