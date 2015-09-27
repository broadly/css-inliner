'use strict';
const Crypto    = require('crypto');
const Immutable = require('immutable');


function hashTag(tag) {
  const hash = Crypto.createHash('md5').update(tag).digest('hex');
  return hash;
}


function stash(context) {
  const html = context.html;
  const tags = new Map();

  function stashTag(tag) {
    const hash = hashTag(tag);
    tags.set(hash, tag);
    return `@@${hash}@@`;
  }

  const stashed = html.replace(/\{\{(.|\n)*?\}\}/g, stashTag);
  const result  = context
    .set('html', stashed)
    .set('stashed', new Immutable.Map(tags));
  return result;
}


function restore(context) {
  const html = context.html;
  const tags = context.stashed;

  function restoreTag(match, hash) {
    const tag = tags.get(hash);
    return tag || match;
  }

  const restored = html.replace(/@@([0-9a-f]{32})@@/g, restoreTag);

  const result = context
    .set('html', restored)
    .delete('stashed');
  return result;
}


module.exports = { stash, restore };

