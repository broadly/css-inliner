'use strict';
const assert     = require('assert');
const File       = require('fs');
const CSSInliner = require('../');


describe('Performance', function() {

  it('should be fast', function() {
    const count = 1000;
    this.timeout(50000);

    const html      = File.readFileSync(`${__dirname}/email.html`, 'utf8');
    const directory = __dirname;
    const template  = CSSInliner.handlebars;
    const inliner   = new CSSInliner({ directory, template });

    function iterations(remaining) {
      if (remaining > 0)
        return inliner.inlineCSSAsync(html)
          .then(() => iterations(remaining - 1));
    }

    function warmup() {
      return iterations(10);
    }

    function measure(count) {
      const start = process.hrtime();
      return iterations(count)
        .then(()=> process.hrtime(start));
    }

    return warmup()
      .then(()=> measure(count))
      .then(function(hrtime) {
        const elapsed  = (hrtime[0] * 1000) + (hrtime[1] / 1000000);
        const per      = elapsed / count;
        process.stdout.write(`Completed ${count} iterations in ${elapsed} ms, each in ${per} ms\n`);
        assert(per < 5, `Expected to complete on iteration in < ~5ms, got ${per}ms`);
      });
  });

});
