'use strict';
const name          = require('../package.json').name;
const debug         = require('debug')(name);
const extractAsync  = require('./extract_styles');
const inlineStyles  = require('./inline_styles');
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
        const warnings  = result.warnings;
        if (warnings.length)
          debug('Inline warnings:\n%s', warnings.join('\n'));
        return result;
      })
      .then(inlineStyles)
      .then(function(inlined) {
        const elapsed   = Date.now() - start;
        debug('Inlined in %d ms', elapsed);
        return inlined;
      });
  }

};

