// Read-through cache.  Working on a better implementation in separate branch.
'use strict';

module.exports = class ReadThrough extends Map {

  get(key, callback) {
    if (this.has(key))
      return super.get(key);

    const self    = this;
    const promise = Promise.resolve().then(callback);
    this.set(key, promise);
    promise
      .catch(function() {
        const entry = Map.prototype.get.call(self, key);
        if (entry && entry.value === promise)
          self.delete(key);
      });

    return promise;
  }

};

