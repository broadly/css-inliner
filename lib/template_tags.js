'use strict';
const Crypto      = require('crypto');
const Immutable   = require('immutable');
const findTags    = require('./handlebars');


function stash(context) {
  const html = context.html;

  const tags      = findTags(html).sort((a, b)=> b.length - a.length);
  const stashed   = new Map();
  const replaced  = tags.reduce(stashTag(stashed), html);
  const result    = context
    .set('html', replaced)
    .set('stashed', new Immutable.Map(stashed));
  return result;
}


function stashTag(stashed) {
  return function(html, tag) {
    const hash  = hashTag(tag);
    stashed.set(hash, tag);

    const marker = `--template-tag:${hash}`;
    // Cheap trick to replace all occurrences of tags
    return html.split(tag).join(marker);
  };
}


function hashTag(tag) {
  const hash = Crypto.createHash('md5').update(tag).digest('hex');
  return hash;
}


function restore(context) {
  const html    = context.html;
  const stashed = context.stashed;
  if (stashed) {

    const restored  = html.replace(/--template-tag:[0-9a-f]{32}/g, restoreStashedTags(stashed));
    const result    = context
      .set('html', restored)
      .delete('stashed');
    return result;

  } else
    return context;
}


function restoreStashedTags(stashed) {
  return function(marker) {
    const hash  = marker.split(':')[1];
    const tag   = stashed.get(hash);
    return tag || marker;
  };
}


module.exports = { stash, restore };

