import SoundEmitter from './SoundEmitter.js';
import Vector2 from './Vector2.js';

export default class Island {
  constructor(args) {
    // Assign arguments to object properties\
    this.assignArgsToProps(args);

    this.state = {
      defaultCoords: new Vector2(0),
      nearest: new Vector2(0),
      onScreen: false
    };
  }
  init = function(gridSize, offset, bounds) {
    this.translatePosition(offset, bounds.center, gridSize);
    this.initAudio(bounds.size);

    return;
  };
  watch = function() {
    this.domNode.addEventListener('mouseenter', this.onMouse.bind(this));
    this.domNode.addEventListener('mouseleave', this.onMouse.bind(this));
    this.domNode.addEventListener('click', this.onClick.bind(this));
    this.navLink.addEventListener('click', this.onClick.bind(this));
  };
  initAudio = function(bounds) {
    var {
      nearest: {
        v: [nX, nY]
      }
    } = this.state;
    this.sound = new SoundEmitter(this.audioSrc, [nX, nY], bounds);
  };
  assignArgsToProps = function(args = null) {
    if (args == null || typeof args !== 'object') return;
    return Object.keys(args).forEach(key => {
      this[key] = args[key];
    });
  };
  setState = function(propsToUpdate = {}) {
    if (propsToUpdate == null || typeof propsToUpdate !== 'object') return;

    this.state = {
      ...this.state,
      ...propsToUpdate
    };

    return;
  };
  translatePosition = function(offset, clientCenter, gridSize) {
    if (gridSize == null || isNaN(gridSize)) return;

    this.state.defaultCoords.set(
      this.position.multiply(gridSize, true).map(Math.round)
    );

    this.updateDistanceToNearest(offset, clientCenter, gridSize);
    return;
  };
  updateDistanceToNearest = function(offset, clientCenter, gridSize) {
    if (clientCenter == null || gridSize == null) return;

    this.state.nearest.set(
      this.getDistanceToNearest(offset, clientCenter, gridSize)
    );
  };
  getDistanceToNearest = function(offset, clientCenter, gridSize) {
    const { defaultCoords } = this.state;
    if (clientCenter == null || gridSize == null) return defaultCoords;

    var offsetCenter = offset.add(clientCenter, true);

    const distance = defaultCoords.subtract(offsetCenter, true);

    const threshold = Math.ceil(gridSize / 2);

    const nearest = distance.map((distance, dimension) =>
      Math.abs(distance) <= threshold
        ? distance
        : distance > 0
        ? defaultCoords.v[dimension] - gridSize - offsetCenter[dimension]
        : defaultCoords.v[dimension] + gridSize - offsetCenter[dimension]
    );

    return nearest;
  };
  update = function(gridSize, offset, bounds) {
    this.updateDistanceToNearest(offset, bounds.center, gridSize);
    var {
      nearest: {
        v: [nX, nY]
      }
    } = this.state;
    this.setPos([nX, nY]);
  };
  setPos = function([x, y]) {
    this.sound.tick([x, y]);
  };
  onResize = function(offset, bounds, gridSize) {
    this.translatePosition(offset, bounds.center, gridSize);
    this.sound.onResize(bounds.size);
  };
}
