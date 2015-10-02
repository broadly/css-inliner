// Stash and restore template tags to assist in processing templates.
//
// There are two stages:
//
// stash    - Must happen before HTML parsing of the template, will find all
//            template tags and replace them with markers that are safe to parse
//
// restore  - Must happen after HTML serialization of the template, will find
//            all markers and replace them back with the original tags
//
// Stash and restore require the context to have a function that returns all the
// tags to ignore, otherwise, these stages do nothing.

'use strict';
const assert    = require('assert');
const Crypto    = require('crypto');
const debug     = require('./debug');
const Immutable = require('immutable');


// Template tags are replaced with markers that consist of prefix and hash.
//
// The hash is used to find the tag later again, is unique enough to not be
// confused for anything else in the template.
//
// The prefix makes the marker look like a CSS property (name:value).  This is
// necessary if the template tag is used in the style attribute, since we need
// to parse that attribute during inlining.  If the marker doesn't look like a
// CSS property, PostCSS throws a fit.
const MARKER_PREFIX = '--tag-marker:';

// Regular expression for finding and replacing all markers in the template.
// Will match the full marker, and the first substitution pattern will match the
// hash.
const MARKER_REGEXP = RegExp(`${MARKER_PREFIX}([0-9a-f]{32})`, 'g');


module.exports = {


  // This stage must run before the HTML parser.  It finds all the template tags
  // in the document, stashes them in context.stashedTags, and replaces them in the
  // HTML source with special markers, returning context.html that is safe to
  // parse.
  //
  // Output:  context with new html, maybe stashed
  stash(context) {
    const html      = context.html;
    assert(html, 'Expected context to contain html property');
    const getTemplateTags  = context.template;

    if (getTemplateTags) {

      debug('%s: Stashing template tags using template function %s()', context.filename, getTemplateTags.name);

      const stashedTags   = new Map();
      const stashTag      = stashTagsInto(stashedTags);
      const tags          = solveForNestedTags( getTemplateTags(html) );
      // Returns template without tags (markers instead) and stashes tags in map
      const tagsReplaced  = tags.reduce(stashTag, html);

      const result      = context
        .set('html', tagsReplaced)
        .set('stashedTags', Immutable.Map(stashedTags));
      return result;

    } else
      return context;
  },


  // This stage must run after the HTML serializer.  It finds all the template tags
  // that were replaced with markers, and puts the original tags back in their
  // place.
  //
  // Input:   context with html, optional stashed
  // Output:  context with new html
  restore(context) {
    const html    = context.html;
    assert(html, 'Expected context to contain html property');
    const stashedTags = context.stashedTags;

    if (stashedTags) {

      debug('%s: Restoring %d template tags', context.filename, stashedTags.size);

      const restoreTag    = restoreTagsFrom(stashedTags);
      const tagsRestored  = html.replace(MARKER_REGEXP, restoreTag);
      const result        = context
        .set('html', tagsRestored)
        .delete('stashedTags');
      return result;

    } else
      return context;
  },


  // True if this string is a tag marker
  isTagMarker(string) {
    return MARKER_REGEXP.test(string);
  }

};


// Returns a reduce function that will stash a tag found in the template.
//
// The reduce function is called with template and tag, it replaces all
// occurrences of that tag with a marker, adds the tag to the map, and returns
// the template after substitution.
//
// The keys to the map are hashes of the tag, which are also used in the marker.
function stashTagsInto(stashedTags) {
  // (template, tag) -> template
  return function(template, tag) {
    const hash  = hashForTag(tag);
    stashedTags.set(hash, tag);

    const marker = `${MARKER_PREFIX}${hash}`;
    return replaceAll(template, tag, marker);
  };
}


// Cheap trick to replace the same tag multiple times, faster than global
// replace on V8, see http://jsperf.com/replace-all-vs-split-join
function replaceAll(string, find, substitute) {
  return string.split(find).join(substitute);
}


// Returns a replace function that will restore a tag from its marker.
//
// The regular expression matches against the full marker, and the first
// substitution pattern matches the hash itself.
//
// The map was previous created with stashTagsInto.
function restoreTagsFrom(stashedTags) {
  // (marker, hash) -> tag
  return function(marker, hash) {
    const originalTag = stashedTags.get(hash);
    return originalTag || marker;
  };
}


// Some template languages allow tags to be nested, we can work around that
// by replacing the longest tags first
//
// [tag] -> Set(tag)
function solveForNestedTags(tags) {
  const uniqueTags    = Immutable.Set(tags);
  const longestFirst  = uniqueTags.sort(byLengthDesc);
  return longestFirst;
}


// Comparator of two strings by their length
function byLengthDesc(a, b) {
  return b.length - a.length;
}


// Create a hash from the tag, which would result in a unique marker, that we
// can easily substitute back for the tag
function hashForTag(tag) {
  const hash = Crypto.createHash('md5').update(tag).digest('hex');
  return hash;
}

