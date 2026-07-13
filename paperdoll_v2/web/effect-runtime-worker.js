"use strict";

self.window = self;
importScripts("vendor/pako_inflate.min.js", "vendor/UPNG.js");

self.addEventListener("message", async (event) => {
  const { id, src, defaultDelay } = event.data;
  try {
    const response = await fetch(src);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const decoded = UPNG.decode(await response.arrayBuffer());
    const frames = UPNG.toRGBA8(decoded);
    const delays = frames.map((_, index) => (
      Math.max(20, Number(decoded.frames?.[index]?.delay || defaultDelay || 33))
    ));
    self.postMessage({
      id,
      width: decoded.width,
      height: decoded.height,
      delays,
      frames,
    }, frames);
  } catch (error) {
    self.postMessage({ id, error: String(error?.message || error) });
  }
});
