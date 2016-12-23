'use strict';
const assert     = require('assert');
const File       = require('fs');
const CSSInliner = require('../');


describe('Performance', function() {

  it('should be fast', function() {
    const count = 1000;
    this.timeout(50000);

    const html      = File.readFileSync(`${__dirname}/email.html`);
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
        assert(per < 10, `Expected to complete an iteration in < ~10ms, got ${per}ms`);
      });
  });


  describe('yielding', function() {

    // Counts how many times we yield to allow other CPU/IO work to occur.
    // Returns an object with the count (ticks) and a stop method.
    function countTicks() {
      const counter = {
        ticks:    0,
        running:  true,
        stop() {
          counter.running = false;
        }
      };

      function countTick() {
        if (counter.running) {
          ++counter.ticks;
          setImmediate(countTick);
        }
      }
      setImmediate(countTick);

      return counter;
    }


    it('should yield after every step', function() {
      const html      = '<style>@media print {}</style><h1>{{header}}</h1>';
      const directory = __dirname;
      const template  = CSSInliner.handlebars;
      const inliner   = new CSSInliner({ directory, template });

      const counter   = countTicks();

      const expected = 8;
      return inliner.inlineCSSAsync(html)
        .then(function() {
          counter.stop();
          assert.equal(counter.ticks, expected);
        });
    });

  });

});
