import Vector2 from './Vector2.js';
import Bounds from './Bounds.js';

const ratePresets = {
  waves: [0.007, 0.028],
  waves2: [0.01, 0.034],
  cspirals: [0.01, 0.045],
  clouds: [0.0105, 0.034],
  acidtrip: [0.0109, 0.0339],
  chaoticclouds: [0.011, 0.034],
  jellyfish: [0.014, 0.055],
  spotsnspots: [0.022, 0.055],
  growingspots: [0.014, 0.047],
  radiate: [0.0145, 0.0438],
  chaoticripples: [0.0155, 0.049],
  ripples: [0.016, 0.047],
  fieldpulse: [0.018, 0.045],
  microspirals: [0.0195, 0.054],
  spirals: [0.018, 0.051],
  largerspirals: [0.014, 0.049],
  flashes: [0.022, 0.047],
  spotsnstripes: [0.022, 0.051],
  pulsingspots_fast: [0.022, 0.0585],
  pulsingspots_slow: [0.025, 0.06],
  crumblinghoneycomb: [0.024, 0.051],
  chaos: [0.026, 0.051],
  mazeychaos: [0.026, 0.055],
  spotnworm: [0.026, 0.057],
  holeymoley: [0.029, 0.055],
  maze: [0.029, 0.057],
  resonantmaze: [0.03, 0.0565],
  negativeworms: [0.03, 0.057],
  wipeout: [0.034, 0.0557],
  feeners: [0.037, 0.06],
  sticksnspots: [0.038, 0.063],
  stripestospots: [0.039, 0.058],
  turing: [0.042, 0.059],
  sticksnspots2: [0.046, 0.065],
  holeymoley2: [0.048, 0.06],
  negativesticksnspots: [0.054, 0.061],
  coral: [0.058, 0.063],
  stix: [0.058, 0.065],
  negative: [0.062, 0.061],
  loops: [0.062, 0.063],
  stixballs: [0.062, 0.065],
  clovers: [0.074, 0.061],
  wormsnloops: [0.082, 0.06],
  bubblecells: [0.082, 0.059],
  fatworms: [0.098, 0.056]
};

export default class ReactionDiffusionMap {
  constructor(data, canvas, gpuArr, viewport, scaleFactor, gridWidth) {
    var { size: viewportSize } = viewport;
    this.viewport = new Bounds(viewportSize.map(v => v / scaleFactor));
    this.pos = {
      default: new Vector2([0, 0]),
      center: new Vector2(this.viewport.center),
      cell: [0, 0]
    };
    this.rate = [0, 0];
    this.canvas = {
      onScreen: {
        canvas: canvas,
        context: canvas.getContext('2d')
      },
      pattern: {},
      offScreen: {},
      mask: {},
      maskPattern: {}
    };
    this.data = data;
    var cellSize = this.getCellSize();
    this.grid = [gridWidth, cellSize, cellSize * gridWidth];
    var { size } = this.viewport;
    this.buffers = {
      mask: new Array(size[1]).fill(new Array(size[0]).fill(0)),
      a: {
        prev: new Array(size[1]).fill(new Float32Array(size[0]).fill(1.0)),
        current: new Array(size[1]).fill(new Float32Array(size[0]).fill(1.0))
      },
      b: {
        prev: new Array(size[1]).fill(new Float32Array(size[0]).fill(0.0)),
        current: new Array(size[1]).fill(new Float32Array(size[0]).fill(0.0))
      }
    };
    this.envData = {
      seed: [],
      mask: []
    };
    this.thresholds = [0.1, 0.2, 0.9];
    this.globalAlpha = 1.0;
    this.iterationsPerTick = 2;
    this.hasInit = false;
    this.shouldSeed = false;
    this.colours = [
      [4, 0, 8],
      // [26, 1, 35],
      [25, 12, 35],
      // [98, 0, 19]
      [98, 0, 25]
    ];
    this.rates = [
      ratePresets.growingspots[0], // feed
      ratePresets.growingspots[1], // kill
      1.0, // deltaT
      1.0, // diffusionA
      0.5 // diffusionB
    ];

    this.gpu = gpuArr;
    this.kernels = [];

    this.init(viewport, scaleFactor);
  }
  init = function(viewport, scaleFactor) {
    this.onResize(viewport, scaleFactor);
    this.initWorker();
  };
  initWorker = function() {
    this.canvasWorker = new Worker('./workers/canvas.worker.js');

    this.canvasWorker.postMessage({
      type: 'INIT',
      data: { easing: 0.35, scaleFactor: this.scaleFactor }
    });

    this.canvasWorker.addEventListener(
      'message',
      ({ data: { type, data } }) => {
        switch (type) {
          default:
            break;
          case 'DRAW': {
            this.canvas.offScreen.context.putImageData(data.buffer, 0, 0);
            document.querySelector(
              '#bgfill'
            ).style.backgroundColor = `rgb(${data.bg[0]},${data.bg[1]},${data.bg[2]})`;
            this.canvas.onScreen.canvas.style.opacity = this.globalAlpha;
            this.draw();
          }
        }
      }
    );
  };
  initOffscreen = function() {
    var {
      size: [vW, vH]
    } = this.viewport;
    var [,,gridSize] = this.grid;

    var offScreenCanvas = new OffscreenCanvas(vW, vH);
    this.canvas.offScreen = {};
    this.canvas.offScreen.canvas = offScreenCanvas;
    this.canvas.offScreen.context = offScreenCanvas.getContext('2d');
    var patternCanvas = new OffscreenCanvas(vW, vH);
    this.canvas.pattern = {};
    this.canvas.pattern.canvas = patternCanvas;
    this.canvas.pattern.context = patternCanvas.getContext('2d');
    var maskCanvas = new OffscreenCanvas(gridSize, gridSize);
    this.canvas.mask = {};
    this.canvas.mask.canvas = maskCanvas;
    this.canvas.mask.context = maskCanvas.getContext('2d');
  };
  onResize = function({ size: viewportSize }, scaleFactor) {
    this.scaleFactor = scaleFactor;
    this.viewport.set(viewportSize.map(v => v / scaleFactor));

    var cellSize = this.getCellSize();
    this.grid[1] = cellSize
    this.grid[2] = cellSize * this.grid[0]

    this.pos.cell = this.getCellCoord();
    this.rate = this.getRate();

    this.setCanvasSize();
    this.initOffscreen();
    this.generateEnvData();

    this.iterationsPerTick = viewportSize[0] >= 800 ? 2 : 1;
  };
  setCanvasSize = function() {
    var { onScreen } = this.canvas;
    var {
      size: [width, height]
    } = this.viewport;
    var [gpu1, gpu2] = this.gpu;
    onScreen.canvas.width = width;
    onScreen.canvas.height = height;

    this.kernels[0] = gpu1.createKernel(getReactionDiffusionA, {
      dynamicOutput: false,
      graphical: false,
      optimizeFloatMemory: true,
      // precision: 'single',
      output: [width, height]
    });
    this.kernels[1] = gpu2.createKernel(getReactionDiffusionB, {
      dynamicOutput: false,
      graphical: false,
      optimizeFloatMemory: true,
      // precision: 'single',
      output: [width, height]
    });
  };
  getColour = function(a, b) {
    var value = 255 - _constrain(0, Math.floor((a - b) * 255), 255);
    return value; // rgb array
  };
  calculateReactionDiffusion = function() {
    var {
      size: [width, height]
    } = this.viewport;
    var {
      buffers: { a, b },
      rates: [feed, kill, deltaT, diffusionA, diffusionB],
      kernels: [kernelA, kernelB]
    } = this;

    var newA = kernelA(
      a.current,
      b.current,
      width,
      height,
      diffusionA,
      feed,
      deltaT
    );
    var newB = kernelB(
      a.current,
      b.current,
      width,
      height,
      diffusionB,
      feed,
      kill,
      deltaT
    );

    this.buffers = {
      a: {
        prev: a.current,
        current: newA
      },
      b: {
        prev: b.current,
        current: newB
      }
    };
  };
  updateRatios = function() {
    this.rates = [...this.rate, ...this.rates.slice(2)];
  };
  updatePattern = function() {
    const {
      canvas: {
        offScreen,
        pattern: { context: patternCtx }
      },
      viewport: {
        size: [width, height]
      },
      pos: {
        default: {
          v: [oX, oY]
        }
      }
    } = this;

    var pattern = patternCtx.createPattern(offScreen.canvas, 'repeat');
    var patternOffsetX = oX < 0 ? (width + oX) % width : oX % width;
    var patternOffsetY = oY < 0 ? (height + oY) % height : oY % height;
    patternCtx.translate(-patternOffsetX, -patternOffsetY);
    patternCtx.rect(0, 0, width + patternOffsetX, height + patternOffsetY);
    patternCtx.fillStyle = pattern;
    patternCtx.fill();
    patternCtx.translate(patternOffsetX, patternOffsetY);

    offScreen.context.clearRect(0, 0, width, height);
  };
  getFrameEnvData = function() {
    var {
      envData: { seed, mask, init },
      hasInit,
      buffers: { b },
      viewport: {
        size: [width, height]
      },
      pos: {
        default: {
          v: [oX, oY]
        }
      }
    } = this;
    var [cellCount, cellSize, gridSize] = this.grid;

    var seedFactor = 0.3;

    this.shouldSeed = false;
    this.hasInit = true;

    var bufferData = b.current.map((row, y) =>
      row.map((val, x) => {
        if (!hasInit) {
          var pixelIndex = (y * width + x) * 4;
          var value = init[pixelIndex] / 255;

          return value > 0.2 ? 0.45 : 0;
        }
        var offsetX = Math.floor(
          oX < 0 ? (gridSize + oX + x) % gridSize : (oX + x) % gridSize
        );
        var offsetY = Math.floor(
          oY < 0 ? (gridSize + oY + y) % gridSize : (oY + y) % gridSize
        );
        var seedVal = seed[offsetY][offsetX] > 0.5 ? seedFactor : val;

        return Math.min(1, seedVal);
      })
    );

    return bufferData;
  };
  applyMask = function() {
    var {
      canvas: {
        mask: { canvas: maskCanvas },
        offScreen: { canvas: patternCanvas, context: patternCtx },
        onScreen
      },
      viewport: {
        size: [width, height]
      },
      pos: {
        default: {
          v: [oX, oY]
        }
      }
    } = this;
    var [cellCount, cellSize, gridSize] = this.grid;

    var pattern = patternCtx.createPattern(maskCanvas, 'repeat');
    var patternOffsetX = oX < 0 ? (gridSize + oX) % gridSize : oX % gridSize;
    var patternOffsetY = oY < 0 ? (gridSize + oY) % gridSize : oY % gridSize;
    patternCtx.translate(-patternOffsetX, -patternOffsetY);
    patternCtx.rect(0, 0, width + patternOffsetX, height + patternOffsetY);
    patternCtx.fillStyle = pattern;
    patternCtx.fill();
    patternCtx.translate(patternOffsetX, patternOffsetY);

    onScreen.context.globalCompositeOperation = 'destination-out';
    onScreen.context.drawImage(patternCanvas, 0, 0, width, height);
    onScreen.context.globalCompositeOperation = 'source-over';

    patternCtx.clearRect(0, 0, width, height);
  };
  generateEnvData = function() {
    var {
      canvas: {
        offScreen,
        mask: { context: maskCtx }
      },
      viewport: {
        size: [width, height]
      }
    } = this;
    var [cellCount, cellSize, gridSize] = this.grid;
    var seedCanvas = new OffscreenCanvas(gridSize, gridSize);
    var seedCtx = seedCanvas.getContext('2d');

    var imgInit = document.querySelector('#init__seed');
    var imgSeed = document.querySelector('#env__seed');
    var imgMask = document.querySelector('#env__mask');
    offScreen.context.clearRect(0, (height - width) / 2, width, width);
    offScreen.context.drawImage(imgInit, 0, (height - width) / 2, width, width);
    seedCtx.drawImage(imgSeed, 0, 0, gridSize, gridSize);
    maskCtx.drawImage(imgMask, 0, 0, gridSize, gridSize);
    var initImgData = offScreen.context.getImageData(0, 0, width, height).data;
    var seedImgData = seedCtx.getImageData(0, 0, gridSize, gridSize).data;

    var envData = {
      init: initImgData,
      seed: new Array(gridSize)
        .fill(new Array(gridSize).fill(0))
        .map((row, y) =>
          row.map((v, x) => {
            return this.getPixelValue(seedImgData, gridSize, [x, y], 'A') / 255;
          })
        )
      // mask: new Array(gridSize).fill(new Array(gridSize).fill(0)).map((row, y) =>
      //   row.map((v, x) => {
      //     return this.getPixelValue(maskImgData, gridSize, [x, y], 'A') / 255;
      //   })
      // )
    };

    offScreen.context.clearRect(0, (height - width) / 2, width, width);

    this.envData = envData;

    seedCanvas = null;
  };
  getPixelValue = function(imgData, gridSize, [x, y], channel = null) {
    var index = (x + y * gridSize) * 4;
    var red = imgData[index];
    var green = imgData[index + 1];
    var blue = imgData[index + 2];
    var alpha = imgData[index + 3];

    switch (channel) {
      case 'R':
      case 0:
        return red;
      case 'G':
      case 1:
        return green;
      case 'B':
      case 2:
        return blue;
      case 'A':
      case 3:
        return alpha;
      default:
      case null:
        return [red, green, blue, alpha];
    }
  };
  updatePixels = function() {
    var {
      canvas: { offScreen },
      viewport: {
        size: [width, height]
      },
      buffers: {
        a: { current: aBuffer },
        b: { current: bBuffer }
      },
      thresholds: offsetThresholds,
      colours
    } = this;

    var pixelBuffer = offScreen.context.createImageData(width, height);

    this.canvasWorker.postMessage({
      type: 'DRAW',
      data: {
        pixelBuffer,
        aBuffer,
        bBuffer,
        offsetThresholds,
        colours,
        size: [width, height],
        globalAlpha: this.globalAlpha
        // mask
      }
    });
  };
  draw = function() {
    const {
      canvas: { onScreen, pattern },
      viewport: {
        size: [width, height]
      }
    } = this;

    this.updatePattern();
    onScreen.context.drawImage(pattern.canvas, 0, 0, width, height);
    this.applyMask();
  };
  getCellSize = function() {
    var [width, height] = this.viewport.size;

    var cellSize = Math.floor((width + height) * 0.5);

    return cellSize;
  };
  getCellCoord = function() {
    var [cellCount, cellSize, gridSize] = this.grid;

    // get coordinates of viewport center
    var cMid = this.pos.center.v.map(coord =>
      coord >= 0 ? coord % gridSize : gridSize + (coord % gridSize)
    );

    var cellCoord = cMid.map(coord => Math.floor(coord / cellSize));

    return cellCoord;
  };
  getCellBounds = function() {
    var [cellCount,cellSize] = this.grid;
    var {
      center: { v: offsetCenter },
      cell: cellPos
    } = this.pos;
    var rowCellCount = this.data.length;

    var start = offsetCenter.map((v, dim) =>
      v > Math.floor(((cellPos[dim] + 1) * cellSize) / 2)
        ? cellPos[dim]
        : cellPos[dim] - 1 >= 0
        ? cellPos[dim] - 1
        : rowCellCount - 1
    );
    var end = start.map(v => (v + 1) % rowCellCount);

    var cellBounds = [
      [start[0], end[0]],
      [start[1], end[1]]
    ];

    return cellBounds;
  };
  getRate = function() {
    var [[x0, x1], [y0, y1]] = this.getCellBounds();
    var [, cellSize, gridSize] = this.grid;

    var vMid = this.pos.center.v.map(coord =>
      Math.floor(coord >= 0 ? coord % gridSize : gridSize + (coord % gridSize))
    );
    var cellProgress = vMid.map(
      coord => ((coord + cellSize / 2) / cellSize) % 1
    );
    var feedBounds = [
      this.data[y0][x0].rates[0],
      this.data[y0][x1].rates[0],
      this.data[y1][x0].rates[0],
      this.data[y1][x1].rates[0]
    ];

    var feed = bilinearInterpolation(
      feedBounds,
      cellProgress[1],
      cellProgress[0]
    );
    var killBounds = [
      this.data[y0][x0].rates[1],
      this.data[y0][x1].rates[1],
      this.data[y1][x0].rates[1],
      this.data[y1][x1].rates[1]
    ];
    var kill = bilinearInterpolation(
      killBounds,
      cellProgress[1],
      cellProgress[0]
    );

    return [feed, kill];
  };
  getPalette = function() {
    var [x, y] = this.pos.cell;
    return this.data[y][x].palette;
  };
  setPosition = function(newPos) {
    // update position
    this.pos.default.set(newPos.divide(this.scaleFactor, true));
    this.pos.center.set(this.pos.default.add(this.viewport.center, true));
    this.pos.cell = this.getCellCoord();
  };
  tick = function(newPos, dragging) {
    this.setPosition(newPos);
    this.rate = this.getRate();
    this.colours = this.getPalette();

    this.calculate(dragging);
    this.updatePixels();
  };
  calculate = function(dragging) {
    var { shouldSeed, hasInit, iterationsPerTick } = this;
    if (shouldSeed || !hasInit || dragging) {
      this.buffers.b.current = this.getFrameEnvData();
    }

    for (let i = 0; i < iterationsPerTick; i++) {
      this.calculateReactionDiffusion();
    }
  };
  onStart = function() {
    var {
      size: [width, height]
    } = this.viewport;

    this.buffers.a.prev = new Array(height).fill(
      new Float32Array(width).fill(1.0)
    );
    this.buffers.a.current = new Array(height).fill(
      new Float32Array(width).fill(1.0)
    );
    this.buffers.b.prev = new Array(height).fill(
      new Float32Array(width).fill(0.0)
    );
    this.buffers.b.current = new Array(height).fill(
      new Float32Array(width).fill(0.0)
    );
    this.updateRatios();

    this.shouldSeed = true;
  };
  onFadeIn = function(progress) {
    this.globalAlpha = progress;
  };
  onFadeOut = function(progress) {
    this.globalAlpha = 1 - progress;
  };
}

function getReactionDiffusionA(
  currentA,
  currentB,
  width,
  height,
  diffusionA,
  feed,
  deltaT
) {
  var prevA = currentA[this.thread.y][this.thread.x];
  var prevB = currentB[this.thread.y][this.thread.x];

  var lX = this.thread.x - 1;
  if (this.thread.x === 0) {
    lX = width - 1;
  }
  var lY = this.thread.y - 1;
  if (this.thread.y === 0) {
    lY = height - 1;
  }
  var laplaceA = currentA[lY][lX] * 0.05;
  laplaceA += currentA[lY][(lX + 1) % width] * 0.2;
  laplaceA += currentA[lY][(lX + 2) % width] * 0.05;

  laplaceA += currentA[(lY + 1) % height][lX] * 0.2;
  laplaceA += prevA * -1;
  laplaceA += currentA[(lY + 1) % height][(lX + 2) % width] * 0.2;

  laplaceA += currentA[(lY + 2) % height][lX] * 0.05;
  laplaceA += currentA[(lY + 2) % height][(lX + 1) % width] * 0.2;
  laplaceA += currentA[(lY + 2) % height][(lX + 2) % width] * 0.05;

  var newA =
    prevA +
    (diffusionA * laplaceA - prevA * Math.pow(prevB, 2) + feed * (1 - prevA)) *
      deltaT;

  return newA;
}
function getReactionDiffusionB(
  currentA,
  currentB,
  width,
  height,
  diffusionB,
  feed,
  kill,
  deltaT
) {
  var prevA = currentA[this.thread.y][this.thread.x];
  var prevB = currentB[this.thread.y][this.thread.x];

  var lX = this.thread.x - 1;
  var lY = this.thread.y - 1;
  if (this.thread.x === 0) {
    lX = width - 1;
  }
  if (this.thread.y === 0) {
    lY = height - 1;
  }
  var laplaceB = currentB[lY][lX] * 0.05;
  laplaceB += currentB[lY][(lX + 1) % width] * 0.2;
  laplaceB += currentB[lY][(lX + 2) % width] * 0.05;

  laplaceB += currentB[(lY + 1) % height][lX] * 0.2;
  laplaceB += prevB * -1;
  laplaceB += currentB[(lY + 1) % height][(lX + 2) % width] * 0.2;

  laplaceB += currentB[(lY + 2) % height][lX] * 0.05;
  laplaceB += currentB[(lY + 2) % height][(lX + 1) % width] * 0.2;
  laplaceB += currentB[(lY + 2) % height][(lX + 2) % width] * 0.05;

  var newB =
    prevB +
    (diffusionB * laplaceB +
      prevA * Math.pow(prevB, 2) -
      prevB * (kill + feed)) *
      deltaT;

  return newB;
}
function linearInterpolation([x0, x1], prog) {
  return x0 * (1 - prog) + x1 * prog;
}
function bilinearInterpolation([x0, x1, x2, x3], row, col) {
  var y0 = linearInterpolation([x0, x1], col);
  var y1 = linearInterpolation([x2, x3], col);
  return parseFloat(linearInterpolation([y0, y1], row).toFixed(5));
}
