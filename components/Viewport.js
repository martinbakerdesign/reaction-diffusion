import Bounds from './Bounds.js';

export default class Viewport extends Bounds {
  constructor(initSize, callback) {
    super(initSize);
    this.size = [0, 0];
    this.center = [0, 0];
    this.devicePixelRatio = 0;
    this.isTouch = false;
    this.timeout = null;
    this.hasInit = false;
    this.callback = callback;
    this.debounceDur = 100;

    this.onResize();
    this.watch();
  }
  debounceResize = function() {
    this.removeTimeout();

    this.timeout = setTimeout(this.onResize.bind(this), this.debounceDur);
  };
  removeTimeout = function() {
    clearTimeout(this.timeout);
    this.timeout = null;
  };
  onResize = function() {
    this.set(this.getSize());
    this.devicePixelRatio = this.getDevicePixelRatio().devicePixelRatio;
    this.isTouch = this.isTouchDevice();

    this.removeTimeout();

    if (!this.hasInit) {
      this.hasInit = true;
      return;
    }

    this.callback();
  };
  watch = function() {
    window.addEventListener('resize', this.debounceResize.bind(this));
  };
  getSize = function() {
    const { clientWidth: cW, clientHeight: cH } = document.documentElement;

    return [cW, cH];
  };
  getDevicePixelRatio = function() {
    const STEP = 0.05;
    const MAX = 5;
    const MIN = 0.5;
    const mediaQuery = v => `(-webkit-min-device-pixel-ratio: ${v}),
    (min--moz-device-pixel-ratio: ${v}),
    (min-resolution: ${v}dppx)`;

    // * 100 is added to each constants because of JS's float handling and
    // numbers such as `4.9-0.05 = 4.8500000000000005`
    let maximumMatchingSize;
    for (let i = MAX * 100; i >= MIN * 100; i -= STEP * 100) {
      if (window.matchMedia(mediaQuery(i / 100)).matches) {
        maximumMatchingSize = i / 100;
        break;
      }
    }

    return {
      isZoomed:
        window.devicePixelRatio === undefined
          ? 'unknown'
          : parseFloat(window.devicePixelRatio) !==
            parseFloat(maximumMatchingSize),
      devicePixelRatio: window.devicePixelRatio,
      realPixelRatio: maximumMatchingSize
    };
  };
  isTouchDevice = function() {
    try {
      document.createEvent('TouchEvent');
      return true;
    } catch (e) {
      return false;
    }
  };
}
