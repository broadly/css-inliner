'use strict';

module.exports = function findTags(html) {
  const regexp  = /\{\{(.|\n)*?\}\}/g;
  const tags    = html.match(regexp);
  return tags || [];
};

