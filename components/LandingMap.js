import RAFRunner from './RAFRunner.js';
import ReactionDiffusionMap from './ReactionDiffusionMap.js';
import Soundscape from './Soundscape.js';
import Vector2 from './Vector2.js';
import Viewport from './Viewport.js';
var $ = document.querySelector.bind(document);

var startTypes = ['mousedown', 'touchstart'];
var endTypes = ['mouseup', 'touchend', 'touchcancel'];
var moveTypes = ['mousemove', 'touchmove'];

export default class LandingMap {
  constructor({
    gridWidth,
    reactionDiffusionData,
    artworks,
    gpuArr,
    config = { scaleFactor: 12 }
  }) {
    this.pos = {
      target: new Vector2([0, 0]),
      tween: new Vector2([0, 0])
    };
    this.dom = {
      offsetPos: $('#debug_offsetPos'),
      drag: $('#filter'),
      bg: $('#bgfill')
    };
    this.islands = artworks;
    this.viewport = new Viewport(0, this.onResize.bind(this));
    this.grid = [gridWidth, gridWidth * this.getCellSize()];
    this.scaleFactor = this.getScaleFactor();

    this.reactionDiffusionMap = new ReactionDiffusionMap(
      reactionDiffusionData,
      $('#canvas'),
      gpuArr,
      this.viewport,
      this.scaleFactor,
      gridWidth
    );
    this.soundscape = new Soundscape(artworks);

    this.state = {
      dragging: false,
      mouseDown: false,
      dragStart: false,
      prevTouch: [0, 0],
      ...config
    };

    this.easing = 0.1;

    this.RAFRunner = new RAFRunner({
      onFadeIn: this.onFadeIn.bind(this),
      onFadeOut: this.onFadeOut.bind(this),
      onStart: this.onStart.bind(this),
      onTick: this.onTick.bind(this),
      onStop: this.onStop.bind(this)
    });

    this.init();
  }
  setState = function(obj = {}) {
    this.state = {
      ...this.state,
      ...obj
    };
  };
  init = function() {
    var [, grid] = this.grid;
    this.soundscape.init({
      gridSize: grid,
      bounds: this.viewport,
      offset: this.pos.tween
    });
    this.onResize(true);
    this.watch();
    setTimeout(() => {
      this.RAFRunner.start();
    }, 1000);
  };
  watch = function() {
    var { isTouch } = this.viewport;
    var { drag } = this.dom;

    drag.addEventListener(
      !isTouch ? 'mousedown' : 'touchstart',
      this.onMouse.bind(this)
    );
    drag.addEventListener(
      !isTouch ? 'mouseup' : 'touchend',
      this.onMouse.bind(this)
    );
    drag.addEventListener(
      !isTouch ? 'mousemove' : 'touchmove',
      this.onMouse.bind(this)
    );
  };
  /** SIZING **/
  getScaleFactor = function() {
    var {
      size: [vW]
    } = this.viewport;

    console.log(vW);

    var scaleFactor = vW >= 1920 ? 10 : vW >= 800 ? 8 : 6;

    return scaleFactor;
  };
  getCellSize = function() {
    var {
      size: [vW, vH]
    } = this.viewport;

    return Math.floor((vW + vH) * 0.5);
  };
  /** POSITION **/
  updateDisplayPos = function() {
    this.pos.tween.ease(this.pos.target, this.easing);
  };
  /** ITERATION **/
  onStart = function() {
    this.updateDisplayPos();
    this.reactionDiffusionMap.onStart();
  };
  onTick = function() {
    var [, gridSize] = this.grid;

    this.updateDisplayPos();
    this.soundscape.update({
      gridSize,
      offset: this.pos.tween,
      bounds: this.viewport
    });
    this.reactionDiffusionMap.tick(this.pos.tween, this.state.dragging);
  };
  onStop = function() {
    this.kernels.forEach(kernel => kernel.destroy());
  };
  onFadeIn = function(progress) {
    this.reactionDiffusionMap.onFadeIn(progress);
  };
  onFadeOut = function(progress) {
    this.reactionDiffusionMap.onFadeOut(progress);
  };
  /** EVENT HANDLING **/
  onResize = function(skipRestart = false) {
    this.grid[1] = this.getCellSize() * this.grid[0];
    var [, gridSize] = this.grid;
    this.scaleFactor = this.getScaleFactor();
    if (!skipRestart) this.RAFRunner.stop();

    this.reactionDiffusionMap.onResize(this.viewport, this.scaleFactor);

    this.soundscape.update({
      offset: this.pos.tween,
      gridSize,
      bounds: this.viewport
    });

    if (!skipRestart) this.RAFRunner.start();
  };
  onMouse = function(e) {
    var { dragging, mouseDown } = this.state;
    var { isTouch } = this.viewport;
    var { type, clientX: cX, clientY: cY, movementX: mX, movementY: mY } = e;
    if (startTypes.includes(type) && !dragging) {
      if (isTouch) {
        var {
          changedTouches: [{ clientX: cX, clientY: cY }]
        } = e;
      }
      // dragging start
      this.setState({
        dragging: true,
        mouseDown: true,
        prevTouch: [cX, cY]
      });
    } else if (endTypes.includes(type) && dragging) {
      // dragging end
      this.setState({
        dragging: false,
        mouseDown: false
      });
    } else if (moveTypes.includes(type) && dragging) {
      var movement = [-mX, -mY];

      if (isTouch) {
        var {
          changedTouches: [{ clientX: cX, clientY: cY }]
        } = e;
        var prevTouch =
          this.state.prevTouch != null && this.state.prevTouch[0] != null
            ? this.state.prevTouch
            : [cX, cY];
        movement = [cX - prevTouch[0], cY - prevTouch[1]].map(v => -v);
        this.state.prevTouch = [cX, cY];
      }
      movement = new Vector2(movement);

      this.pos.target.add(movement);
      // this.setState({
      //   dragging: false
      // });
    }
  };
}
