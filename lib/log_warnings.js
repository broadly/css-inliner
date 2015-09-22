const debug = require('debug')('css-inline');

// Log any warnings from context.warnings.
module.exports = function logWarnings(context) {
  const warnings  = context.warnings;
  if (warnings && warnings.size)
    debug('Inline warnings:\n%s', warnings.join('\n'));
  return context;
};

