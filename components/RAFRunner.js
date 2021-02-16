export default class RAFRunner {
  constructor(props) {
    this.frame = null;
    this.state = {
      start: null,
      fadedIn: true,
      fadedOut: false
    };
    this.config = {
      fadeIn: {
        dur: 2000
      },
      fadeOut: {
        dur: 750
      }
    };

    this.dom = {
      stop: document.querySelector('#stop')
    };

    this.callbacks.assign(props);
    this.watch();
  }
  callbacks = {
    assign: function(props) {
      if (props == null || typeof props != 'object') return false;

      Object.keys(props).forEach(key => (this[key] = props[key]));
    }
  };
  watch = function() {
    var { stop } = this.dom;
    stop.addEventListener('click', this.toggleFade.bind(this));
  };
  run = function() {
    this.frame = requestAnimationFrame(this.run.bind(this));
    this.tick();
  };
  tick = function() {
    if (!this.state.fadedOut) {
      if (this.callbacks.onTick) this.callbacks.onTick();
    }
  };
  start = function() {
    if (this.frame) this.stop();
    if (this.callbacks.onStart) this.callbacks.onStart();
    this.run();
  };
  pause = function() {
    if (!this.frame) return false;
    cancelAnimationFrame(this.frame);
  };
  stop = function() {
    this.pause();
    this.frame = null;
  };
  toggleFade = function({
    target: {
      dataset: { stopstart }
    }
  }) {
    if (stopstart === '0') {
      this.fadeOut();
    } else {
      this.fadeIn();
    }
  };
  fadeIn = function() {
    var now = new Date().getTime();
    if (this.state.start == null) {
      this.run();
      this.state.start = now;
      this.state.fadedOut = false;
      this.disableButton(true);
    }
    var progress = Math.min(
      (now - this.state.start) / this.config.fadeIn.dur,
      1
    );

    if (this.callbacks.onFadeIn) this.callbacks.onFadeIn(progress);
    if (progress < 1) return requestAnimationFrame(this.fadeIn.bind(this));

    this.state.start = null;
    this.state.fadedIn = true;
    this.updateButton(0, 'Stop');
    this.disableButton(false);
    return;
  };
  fadeOut = function() {
    var now = new Date().getTime();
    if (this.state.start == null) {
      this.state.start = now;
      this.disableButton(true);
    }

    var progress = Math.min(
      (now - this.state.start) / this.config.fadeOut.dur,
      1
    );

    if (this.callbacks.onFadeOut) this.callbacks.onFadeOut(progress);
    if (progress < 1) return requestAnimationFrame(this.fadeOut.bind(this));

    this.pause();
    this.state.start = null;
    this.state.fadedOut = true;
    this.state.fadedIn = false;
    this.updateButton(1, 'Start');
    this.disableButton(false);
    return;
  };
  disableButton = function(disabled) {
    var { stop } = this.dom;
    stop.disabled = disabled;
  };
  updateButton = function(stopstart, label) {
    var { stop } = this.dom;
    stop.dataset.stopstart = stopstart;
    stop.innerHTML = label;
    return;
  };
}
