export default class Vector2 {
  constructor(v) {
    this.v = this.prepareInput(v);
  }
  prepareInput = function(input) {
    if (input == null) return false;
    var isVector = input instanceof Vector2;
    var isArray = Array.isArray(input) || input instanceof Float32Array;

    return isVector
      ? input.v
      : new Float32Array(
          isArray
            ? [input[0], input[1] != null ? input[1] : input[0]]
            : [input, input]
        );
  };
  set = function(v) {
    this.v = this.prepareInput(v);

    return this;
  };
  add = function(v, returnOnly = false) {
    v = this.prepareInput(v);

    var sum = this.v.map((val, dim) => val + v[dim]);

    if (returnOnly) return sum;

    this.set(sum);
    return this;
  };
  subtract = function(v, returnOnly = false) {
    v = this.prepareInput(v);

    var sum = this.v.map((val, dim) => val - v[dim]);

    if (returnOnly) return sum;

    this.set(sum);
    return this;
  };
  multiply = function(v, returnOnly = false) {
    v = this.prepareInput(v);

    var sum = this.v.map((val, dim) => val * v[dim]);

    if (returnOnly) return sum;

    this.set(sum);
    return this;
  };
  divide = function(v, returnOnly = false) {
    v = this.prepareInput(v);

    var sum = this.v.map((val, dim) => val / v[dim]);

    if (returnOnly) return sum;

    this.set(sum);
    return this;
  };
  ease = function(target, easing = 1) {
    target = new Vector2(this.prepareInput(target));
    var difference = new Vector2(target.subtract(this.v, true));
    var easedDifference = difference.multiply(easing, true);
    this.add(easedDifference);

    return this;
  };
  distance = function(v, returnExploded = false) {
    var byDimension = this.subtract(v, true).map(val => Math.abs(val));
    if (returnExploded) return byDimension;

    var distance = Math.pow(
      byDimension.reduce((prev, current) => prev + Math.pow(current, 2), 0),
      0.5
    );

    return distance;
  };
  clone = function() {
    return new Vector2(this.v);
  };
  inBounds = function(v) {
    v = this.prepareInput(v);

    return this.v.map((val, dim) => Math.abs(val) < v[dim]);
  };
  wrap = function(bounds, returnOnly = false) {
    bounds = this.prepareInput(bounds);

    var wrapped = this.v.map((v, dim) =>
      v < 0 ? (v % bounds[dim]) + bounds[dim] : v % bounds[dim]
    );

    if (returnOnly) return wrapped;

    this.set(wrapped);
  };
}
