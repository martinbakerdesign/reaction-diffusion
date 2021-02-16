export default class World {
  constructor({ artworks, easing, refs }) {
    this.refs = refs;
    this.easing = easing;
    this.client = new Client();

    this.state = {
      size: {
        grid: 0,
        buffer: 0,
        island: 0
      },
      viewport: new Vector2(0),
      viewportTarget: new Vector2(0),
      mousedown: false,
      prevTouch: new Vector2(0)
    };
    this.onResize();

    this.soundboard = new Soundboard(0, this.state.gridSize);
    this.soundboard.setPos([0, 0]);

    this.islands = artworks.map(
      (art, index) =>
        new Island({
          ...art,
          index,
          size: this.state.size.island,
          position: new Vector2(
            this.getRandomCoords(this.state.bufferSize, this.state.gridSize)
          ),
          callbacks: {
            click: this.centerOnIsland.bind(this)
          }
        })
    );
    this.initIslands();
    this.watch();
    this.runner = new RAFRunner({
      onTick: this.onTick.bind(this)
    });
  }
  watch = function() {
    window.addEventListener('resize', this.onResize.bind(this));

    const { scroll } = this.refs;
    // start drag
    startTypes.forEach(type =>
      scroll.addEventListener(
        type,
        this.onMouse.bind(this)
        // supportsPassive ? { passive: true } : false
      )
    );
    // end drag
    endTypes.forEach(type =>
      scroll.addEventListener(
        type,
        this.onMouse.bind(this)
        // supportsPassive ? { passive: true } : false
      )
    );
    // drag
    moveTypes.forEach(type =>
      scroll.addEventListener(
        type,
        this.onMouse.bind(this)
        // supportsPassive ? { passive: true } : false
      )
    );

    window.addEventListener('click', this.onClick.bind(this));
  };
  onResize = function() {
    var {
      bounds: {
        size: [width, height]
      },
      devicePixelRatio
    } = this.client;

    this.state.size.grid = this.getGridSize({
      width,
      height
    });
    this.state.size.buffer = this.getBufferSize();
    this.state.size.island = this.getIslandSize({
      width,
      height,
      devicePixelRatio
    });

    document.documentElement.style.setProperty(
      '--islandsize',
      `${this.state.size.island}px`
    );

    return;
  };
  getGridSize = function({ width, height }) {
    const longest = width > height ? width : height;
    return longest * 8;
  };
  getBufferSize = function() {
    if (this.state.size.grid == null) return;
    return this.state.size.grid * 0.02;
  };
  getRandomCoords = function(buffer = 0, gridSize = this.state.size.grid) {
    const x = getRandomRange(buffer, gridSize - buffer) / gridSize;
    const y = getRandomRange(buffer, gridSize - buffer) / gridSize;
    return [x, y];
  };
  getIslandSize = function({ width, height, devicePixelRatio }) {
    const shortest = width > height ? height : width;
    return shortest * 0.4 * devicePixelRatio;
  };
  onMouse = function(e) {
    var { isTouch } = this.client;
    var { type, clientX: cX, clientY: cY } = e;
    if (isTouch) {
      var {
        changedTouches: [{ clientX: cX, clientY: cY }]
      } = e;
    }
    const { scroll } = this.refs;
    const { mousedown } = this.state;

    // Toggle mousedown
    if (startTypes.includes(type) && !mousedown) {
      this.state.mousedown = true;
      scroll.className = 'active';
      this.state.prevTouch = [cX, cY];
    } else if (endTypes.includes(type) && mousedown) {
      this.state.mousedown = false;
      scroll.className = '';
    }

    // handle drag
    if (moveTypes.includes(type) && mousedown) return this.onDrag(e);
  };
  onDrag = function(e) {
    var { prevTouch } = this.state;
    const { devicePixelRatio, isTouch } = this.client;
    if (isTouch) {
      var {
        changedTouches: [{ clientX, clientY }]
      } = e;
    }
    let mX = 0;
    let mY = 0;
    if (!isTouch) {
      mX = e.movementX;
      mY = e.movementY;
    } else {
      mX = (clientX - prevTouch[0]) * devicePixelRatio;
      mY = (clientY - prevTouch[1]) * devicePixelRatio;

      this.state.prevTouch = [clientX, clientY];
    }

    this.state.viewportTarget.set(
      this.state.viewportTarget.v.map((v, i) => {
        if (i === 0) {
          return v + mX * -1;
        }
        return v + mY * -1;
      })
    );
  };
  onClick = function() {
    this.soundboard.fade(1, 10 * 1000);
    window.removeEventListener('click', this.onClick.bind(this));
    return;
  };
  initIslands = function() {
    const {
      size: { grid },
      viewport
    } = this.state;
    const { bounds } = this.client;
    const { grid: domGrid, ctx } = this.refs;

    return this.islands.forEach((island, index) => {
      island.init(grid, viewport, bounds, domGrid, audioOptions, ctx);
    });
  };
  centerOnIsland = function(island) {
    this.moveToCoord(this.state.viewportTarget.add(island.state.nearest, true));
  };
  moveToCoord = function([x, y]) {
    this.state.viewportTarget.set([x, y]);
  };
  run = function() {
    this.runner.start();
  };
  onTick = function() {
    this.updatePosition();
    this.updateCanvas();
  };
  updatePosition = function() {
    var {
      easing,
      state: {
        viewport,
        viewportTarget,
        size: { grid }
      }
    } = this;
    var [vX, vY] = viewport.ease(viewportTarget, easing).map(val => val % grid);

    this.state.viewport.set([vX, vY]);
  };
  updateIslands = function() {
    this.state.viewport = [vX, vY];
  };
  updateCanvas = function() {
    const { ctx } = this.refs;
    const {
      bounds: {
        size: [width, height]
      }
    } = this.client;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw
    this.drawGrid();
  };
  drawGrid = function() {
    const { grid } = this.state.size;
    const { ctx } = this.refs;

    this.islands.forEach(island => {
      island.update(grid, this.state.viewport, this.client.bounds, ctx);
    });
  };
  updateSoundboard = function() {
    var {
      viewport: [vX, vY]
    } = this.state;

    // this.soundboard.setPos([vX, vY]);
  };
}
