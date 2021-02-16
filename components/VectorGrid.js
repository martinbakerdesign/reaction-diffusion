export default class VectorGrid {
  constructor(grid) {
    this.size = grid.length;
    this.grid = grid;
  }
  set = function(grid) {
    this.grid = grid;
    this.size = grid.length;

    return this;
  };
}
