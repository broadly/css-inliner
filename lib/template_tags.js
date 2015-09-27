'use strict';
const Crypto      = require('crypto');
const Immutable   = require('immutable');


function hashTag(tag) {
  const hash = Crypto.createHash('md5').update(tag).digest('hex');
  return hash;
}


function findTags(html) {
  const regexp  = /\{\{(.|\n)*?\}\}/g;
  const tags    = html.match(regexp);
  return tags || [];
}


function stash(context) {
  const html = context.html;

  const tags    = findTags(html).sort((a, b)=> b.length - a.length);
  const stashed = new Map();

  function stashTag(html, tag) {
    const hash = hashTag(tag);
    stashed.set(hash, tag);
    return html.replace(tag, `tag:${hash}`, 'g');
  }

  const replaced = tags.reduce(stashTag, html);
  const result    = context
    .set('html', replaced)
    .set('stashed', new Immutable.Map(stashed));
  return result;
}


function restore(context) {
  const html = context.html;
  const tags = context.stashed;

  function restoreTag(match, hash) {
    const tag = tags.get(hash);
    return tag || match;
  }

  const restored = html.replace(/tag:([0-9a-f]{32})/g, restoreTag);

  const result = context
    .set('html', restored)
    .delete('stashed');
  return result;
}


module.exports = { stash, restore };

