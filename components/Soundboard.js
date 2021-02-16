export default class Soundboard {
  constructor(volume = 1) {
    this.state = { volume, fade: { step: 1, target: 0, it: 0, itEnd: 0 } };

    this.interval = null;

    this.setVolume(this.state.volume);
  }
  setVolume = function(value) {
    if (value == null) return;
    this.state.volume = value;
    return Howler.volume(value);
  };
  fade = function(target = this.state.volume, duration = 1000) {
    if (target === this.state.volume || target == null || duration == null)
      return;
    target = Math.min(1, Math.max(0, target));
    var itCount = 60;
    var intervalSize = duration / itCount;
    this.state.fade = {
      step: (target - this.state.volume) / itCount,
      target,
      it: 0,
      itEnd: itCount
    };

    if (this.interval !== null) {
      clearInterval(this.interval);
    }
    this.interval = setInterval(this.onInterval.bind(this), intervalSize);
  };
  onInterval = function() {
    const {
      volume,
      fade: { step, it, itEnd }
    } = this.state;

    if (it === itEnd) return this.endFade();

    this.state.fade.it++;
    this.setVolume(volume + step);
  };
  endFade = function() {
    clearInterval(this.interval);
    this.interval = null;
    this.state.fade = {
      step: 1,
      target: 0,
      it: 0,
      itEnd: 0
    };
  };
  setPos = function([x, y] = [0, 0]) {
    Howler.pos = [x, y, 0];
  };
}
