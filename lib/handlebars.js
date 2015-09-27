'use strict';
const Handlebars = require('handlebars');

module.exports = function findTags(html) {
  const oneLine = html.replace(/\n/g, ' ');
  const parts   = Handlebars.parse(oneLine).body;

  const tags = parts
    .filter(part => part.type !== 'ContentStatement')
    .map(part => [part.loc.start.column, part.loc.end.column])
    .map(range => html.slice(range[0], range[1]));
  return tags;
};

