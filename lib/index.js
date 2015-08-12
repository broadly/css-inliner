'use strict';
const DOMUtils      = require('domutils');
const extractAsync  = require('./extract_stylesheets');
const parseHTML     = require('./parse_html');
const Stylesheets   = require('./stylesheets');


module.exports = class CSSInliner {

  constructor(options) {
    this._stylesheets = new Stylesheets(options);
  }


  inlineAsync(html) {
    const start       = Date.now();
    const stylesheets = this._stylesheets;

    return Promise.resolve(html)
      .then(parseHTML)
      .then(function(dom) {
        return extractAsync(dom, stylesheets);
      })
      .then(function(result) {
        const dom       = result.dom;
        const warnings  = result.warnings;
        const inlined   = DOMUtils.getOuterHTML(dom);
        const elapsed   = Date.now() - start;
        return { inlined, warnings, elapsed };
      });
  }

};

