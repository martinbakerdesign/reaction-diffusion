export default class Vector3 {
  constructor(v) {
    this.v = this.prepareInput(v);
  }
  prepareInput = function(input) {
    if (input == null) return false;
    var isVector = input instanceof Vector3;
    var isArray = Array.isArray(input);

    return isVector
      ? input.v
      : isArray
      ? [
          input[0],
          input[1] != null ? input[1] : input[0],
          input[2] != null ? input[2] : input[0]
        ]
      : [input, input, input];
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
}
