export default class Bounds {
  constructor(v = 0) {
    this.size = [0, 0];
    this.center = [0, 0];

    this.set(v);
  }
  prepareInput = function(input) {
    if (input == null) return false;
    var isBounds = input instanceof Bounds;
    var isArray = Array.isArray(input);

    return isBounds
      ? input.v
      : isArray
      ? [input[0], input[1] != null ? input[1] : input[0]].map(Math.floor)
      : [input, input].map(Math.floor);
  };
  set = function(v) {
    v = this.prepareInput(v);
    this.size = v;
    this.center = this.size.map(val => Math.floor(val / 2));

    return this;
  };
}
