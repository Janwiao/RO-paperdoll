(function initNoriEffectRuntime(global) {
  "use strict";

  const defaultTrackLimit = 64 * 1024 * 1024;
  const defaultTotalLimit = 128 * 1024 * 1024;
  const runtimeScriptUrl = document.currentScript?.src || window.location.href;

  class EffectDecoder {
    constructor() {
      this.worker = typeof Worker === "function"
        ? new Worker(new URL("effect-runtime-worker.js", runtimeScriptUrl))
        : null;
      this.queue = [];
      this.active = null;
      this.nextId = 1;
      if (this.worker) {
        this.worker.addEventListener("message", (event) => this.receive(event.data));
        this.worker.addEventListener("error", (event) => this.fail(event.error || new Error(event.message)));
      }
    }

    decode(src, defaultDelay) {
      if (!this.worker) {
        return Promise.reject(new Error("Web Worker is unavailable"));
      }
      return new Promise((resolve, reject) => {
        this.queue.push({ id: this.nextId, src, defaultDelay, resolve, reject });
        this.nextId += 1;
        this.pump();
      });
    }

    pump() {
      if (this.active || !this.queue.length) {
        return;
      }
      this.active = this.queue.shift();
      this.worker.postMessage({
        id: this.active.id,
        src: this.active.src,
        defaultDelay: this.active.defaultDelay,
      });
    }

    receive(message) {
      if (!this.active || message.id !== this.active.id) {
        return;
      }
      const task = this.active;
      this.active = null;
      if (message.error) {
        task.reject(new Error(message.error));
      } else {
        task.resolve(message);
      }
      this.pump();
    }

    fail(error) {
      if (this.active) {
        this.active.reject(error);
        this.active = null;
      }
      this.pump();
    }
  }

  class EffectTrack {
    constructor(effect, src, reserve, release, decoder) {
      this.effect = effect;
      this.src = src;
      this.reserve = reserve;
      this.release = release;
      this.decoder = decoder;
      this.node = null;
      this.frames = [];
      this.delays = [];
      this.totalDuration = 0;
      this.reservedBytes = 0;
      this.ready = false;
      this.disposed = false;
    }

    createFallback() {
      const image = document.createElement("img");
      image.alt = "";
      image.decoding = "async";
      image.className = "effect-runtime-fallback";
      image.dataset.effectId = String(this.effect.id);
      image.dataset.composite = this.effect.runtime?.composite || "source-over";
      image.title = this.effect.const || `effect ${this.effect.id}`;
      image.src = this.src;
      this.node = image;
      return image;
    }

    estimatedBytes() {
      const frameCount = Number(this.effect.runtime?.frame_count || 0);
      return frameCount > 0 ? frameCount * 384 * 384 * 4 : Number.POSITIVE_INFINITY;
    }

    async decode() {
      if (!this.decoder || this.disposed) {
        return false;
      }
      const estimate = this.estimatedBytes();
      if (!Number.isFinite(estimate) || estimate > defaultTrackLimit || !this.reserve(estimate)) {
        return false;
      }
      this.reservedBytes = estimate;

      try {
        const decoded = await this.decoder.decode(
          this.src,
          Number(this.effect.runtime?.frame_ms || 33),
        );
        if (this.disposed) {
          return false;
        }
        const buffers = decoded.frames;
        const actualBytes = buffers.reduce((sum, frame) => sum + frame.byteLength, 0);
        if (actualBytes > this.reservedBytes && !this.reserve(actualBytes - this.reservedBytes)) {
          return false;
        }
        if (actualBytes < this.reservedBytes) {
          this.release(this.reservedBytes - actualBytes);
        }
        this.reservedBytes = actualBytes;
        this.frames = buffers.map((buffer) => new Uint8ClampedArray(buffer));
        this.delays = decoded.delays;
        this.totalDuration = this.delays.reduce((sum, delay) => sum + delay, 0);

        const canvas = document.createElement("canvas");
        canvas.width = decoded.width;
        canvas.height = decoded.height;
        canvas.className = "effect-runtime-canvas";
        canvas.dataset.effectId = String(this.effect.id);
        canvas.dataset.composite = this.effect.runtime?.composite || "source-over";
        canvas.title = this.effect.const || `effect ${this.effect.id}`;
        if (this.node?.isConnected) {
          this.node.replaceWith(canvas);
        }
        this.node = canvas;
        this.ready = true;
        this.renderAt(0);
        return true;
      } catch (error) {
        console.warn("Effect runtime fallback", error);
        return false;
      } finally {
        if (!this.ready && this.reservedBytes) {
          this.release(this.reservedBytes);
          this.reservedBytes = 0;
          this.frames = [];
        }
      }
    }

    frameIndexAt(elapsedMs) {
      if (!this.frames.length || this.totalDuration <= 0) {
        return 0;
      }
      let time = ((elapsedMs % this.totalDuration) + this.totalDuration) % this.totalDuration;
      for (let index = 0; index < this.delays.length; index += 1) {
        if (time < this.delays[index]) {
          return index;
        }
        time -= this.delays[index];
      }
      return this.delays.length - 1;
    }

    renderAt(elapsedMs) {
      if (!this.ready || !(this.node instanceof HTMLCanvasElement)) {
        return;
      }
      const index = this.frameIndexAt(elapsedMs);
      if (this.node.dataset.frameIndex === String(index)) {
        return;
      }
      const context = this.node.getContext("2d");
      context.putImageData(new ImageData(this.frames[index], this.node.width, this.node.height), 0, 0);
      this.node.dataset.frameIndex = String(index);
    }

    dispose() {
      this.disposed = true;
      if (this.reservedBytes) {
        this.release(this.reservedBytes);
      }
      this.reservedBytes = 0;
      this.frames = [];
      this.node?.remove();
    }
  }

  class NoriEffectRuntime {
    constructor(behindLayer, frontLayer) {
      this.layers = { behind: behindLayer, front: frontLayer };
      this.tracks = [];
      this.key = "";
      this.startTime = performance.now();
      this.reservedBytes = 0;
      this.decoder = new EffectDecoder();
      this.animationFrame = 0;
      this.manualTime = null;
      this.pending = new Set();
      this.animate = this.animate.bind(this);
      this.animationFrame = requestAnimationFrame(this.animate);
    }

    reserve(bytes) {
      if (this.reservedBytes + bytes > defaultTotalLimit) {
        return false;
      }
      this.reservedBytes += bytes;
      return true;
    }

    release(bytes) {
      this.reservedBytes = Math.max(0, this.reservedBytes - bytes);
    }

    clear() {
      this.tracks.forEach((track) => track.dispose());
      this.tracks = [];
      Object.values(this.layers).forEach((layer) => layer?.replaceChildren());
      this.reservedBytes = 0;
    }

    sync({ behind = [], front = [], sex, resolveUrl, version }) {
      const entries = [
        ...behind.map((effect) => ({ effect, layerName: "behind" })),
        ...front.map((effect) => ({ effect, layerName: "front" })),
      ];
      const key = entries.map(({ effect, layerName }) => `${layerName}:${sex}:${effect.id}`).join("|");
      if (key === this.key) {
        return;
      }
      this.clear();
      this.key = key;
      this.startTime = performance.now();

      for (const { effect, layerName } of entries) {
        const asset = effect.asset?.[sex];
        const layer = this.layers[layerName];
        if (!asset || !layer) {
          continue;
        }
        const src = `${resolveUrl(asset)}?v=${encodeURIComponent(version)}`;
        const track = new EffectTrack(
          effect,
          src,
          (bytes) => this.reserve(bytes),
          (bytes) => this.release(bytes),
          this.decoder,
        );
        layer.appendChild(track.createFallback());
        this.tracks.push(track);
        const pending = track.decode().finally(() => {
          this.pending.delete(pending);
          this.updateLayerStatus();
        });
        this.pending.add(pending);
      }
      this.updateLayerStatus();
    }

    updateLayerStatus() {
      for (const [layerName, layer] of Object.entries(this.layers)) {
        if (!layer) {
          continue;
        }
        const tracks = this.tracks.filter((track) => track.node?.parentElement === layer);
        layer.dataset.runtimeTracks = String(tracks.filter((track) => track.ready).length);
        layer.dataset.fallbackTracks = String(tracks.filter((track) => !track.ready).length);
        layer.dataset.runtimeLayer = layerName;
      }
    }

    renderAt(elapsedMs) {
      this.tracks.forEach((track) => track.renderAt(elapsedMs));
    }

    animate(timestamp) {
      if (this.manualTime === null) {
        this.renderAt(timestamp - this.startTime);
      }
      this.animationFrame = requestAnimationFrame(this.animate);
    }

    resetClock() {
      this.startTime = performance.now();
      this.renderAt(0);
    }

    async waitUntilSettled(timeoutMs = 8000) {
      if (!this.pending.size) {
        return;
      }
      await Promise.race([
        Promise.allSettled([...this.pending]),
        new Promise((resolve) => setTimeout(resolve, timeoutMs)),
      ]);
    }

    beginCapture() {
      this.manualTime = 0;
      this.renderAt(0);
    }

    captureAt(elapsedMs) {
      this.manualTime = elapsedMs;
      this.renderAt(elapsedMs);
    }

    endCapture() {
      this.manualTime = null;
      this.resetClock();
    }
  }

  global.NoriEffectRuntime = NoriEffectRuntime;
}(window));
