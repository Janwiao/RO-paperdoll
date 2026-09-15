(function (global) {
  "use strict";

  // Values are an image/canvas or a part's named image pools. Count shared
  // objects once. This estimates RGBA storage, not browser/GPU process memory.
  class NoriImageCache extends Map {
    constructor({ maxBytes = 32 * 1024 * 1024, maxEntries = 64 } = {}) {
      super();
      this.maxBytes = maxBytes;
      this.maxEntries = maxEntries;
      this.evictions = 0;
    }

    get(key) {
      const value = super.get(key);
      if (super.has(key)) {
        super.delete(key);
        super.set(key, value);
      }
      return value;
    }

    set(key, value) {
      super.delete(key);
      return super.set(key, value);
    }

    decodedBytes() {
      const images = new Set();
      for (const value of this.values()) {
        if (typeof value?.width === "number") images.add(value);
        else Object.values(value || {}).forEach(image => images.add(image));
      }
      let bytes = 0;
      for (const image of images) {
        bytes += (image.naturalWidth || image.width || 0) * (image.naturalHeight || image.height || 0) * 4;
      }
      return bytes;
    }

    prune(protectedKeys = new Set()) {
      // Never clear/resize an evicted image: an in-flight draw/export may own it.
      for (const key of this.keys()) {
        if (this.size <= this.maxEntries && this.decodedBytes() <= this.maxBytes) break;
        if (protectedKeys.has(key)) continue;
        super.delete(key);
        this.evictions += 1;
      }
      return this.stats();
    }

    stats() {
      const decodedBytes = this.decodedBytes();
      return { entries: this.size, decodedBytes, maxBytes: this.maxBytes,
        maxEntries: this.maxEntries, evictions: this.evictions,
        overBudget: decodedBytes > this.maxBytes || this.size > this.maxEntries };
    }
  }

  global.NoriImageCache = NoriImageCache;
  if (typeof module !== "undefined") module.exports = NoriImageCache;
})(typeof window !== "undefined" ? window : globalThis);
