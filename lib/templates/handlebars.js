// Extract tags from Handlebar templates.
//
// If you need to inline Handlebar templates, do this:
//
//   const template = CSSInliner.handlebars;
//   const inliner  = new CSSInliner({ template });

'use strict';
const Immutable = require('immutable');


// Given the source for an Handlebars template, find and return all the
// Handlebars tags contained there (expressions, blocks, comments, etc)
module.exports = function handlebars(template) {
  const root      = parseForLocation(template);
  const locations = Immutable.List( getLocations(root) ).flatten();
  const hbsTags   = locations.map(location => template.slice(location.start.column, location.end.column) );
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
  const statements = Handlebars.parse(singleLine);
  return statements;
}


// Is this a Handlebars template tag (true) or HTML contents (false)
function isTemplateTag(statement) {
  return statement.type !== 'ContentStatement';
}


// Returns a list of { start, end }, one pair for each Handlebars template tag
function getLocations(statement) {
  const body    = statement.body;
  const program = (statement.program && statement.program.loc) ? statement.program : null;
  const inverse = (statement.inverse && statement.inverse.loc) ? statement.inverse : null;

  if (body)
    return getBodyLocations(body);
  else if (program) {

    const opening   = program.body[0] || program;
    const openTag   = { start: statement.loc.start, end: opening.loc.start };
    const bodyTags  = getBodyLocations(program.body);

    if (inverse) {

      // {{open}} ... something here ... {{else}} ... something else ... {{/close}}
      const elseTag     = { start: program.loc.end, end: inverse.loc.start };
      const inverseTags = getBodyLocations(inverse.body);
      const closeTag    = { start: inverse.loc.end, end: statement.loc.end };
      return [ openTag, bodyTags, elseTag, inverseTags, closeTag ];

    } else {

      // {{open}} ... something here ... {{/close}}
      const closing   = program.body[program.body.length - 1] || program;
      const closeTag  = { start: closing.loc.end, end: statement.loc.end };
      return [ openTag, bodyTags, closeTag ];
    }

  } else if (inverse) {

    // {{open}}{else} ... something here ... {{/close}}
    const openTag   = { start: statement.loc.start, end: inverse.loc.start };
    const bodyTags  = getBodyLocations(inverse.body);
    const closeTag  = { start: inverse.loc.end, end: statement.loc.end };
    return [ openTag, bodyTags, closeTag ];

  } else {
    // Entire statement
    const location = statement.loc;
    return [ location ];
  }
}


// Combine locations from all the statements in the program/inverse body.
//
// Returns a list of { start, end }
function getBodyLocations(body) {
  const tagsOnly  = Immutable.List( body.filter(isTemplateTag) );
  const locations = tagsOnly.flatMap(getLocations);
  return locations;
}

