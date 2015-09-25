// This stage logs any warnings collected while parsing stylesheets.

'use strict';
const debug = require('debug')('css-inline');


// Input:   context with warnings property
// Output:  context without warnings property
module.exports = function logWarnings(context) {
  const warnings  = context.warnings;
  if (warnings && warnings.size)
    debug('Inline warnings:\n%s', warnings.join('\n'));

  const result = context.delete('warnings');
  return result;
};

