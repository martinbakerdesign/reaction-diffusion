/* eslint-disable */

let easing = 0.15;
let scaleFactor = 10;
let offsetPosTarget = [0, 0];
let offsetPosDisplay = [0, 0];
let colourTargets = [];
let frameColours = [];

self.addEventListener('message', ({ data: { type, data } }) => {
  switch (type) {
    default: {
      break;
    }
    case 'INIT': {
      console.log('Canvas Worker Init');
      easing = data.easing;
      scaleFactor = data.scaleFactor;
      break;
    }
    case 'TICK_DISPLAYPOS': {
      offsetPosDisplay = transform(offsetPosDisplay, offsetPosTarget, easing);

      self.postMessage({
        type: 'TICK_DISPLAYPOS',
        data: offsetPosDisplay
      });
      break;
    }
    case 'DRAG': {
      // offsetPosTarget = onDrag(offsetPosTarget, data);
      offsetPosTarget = data;
      break;
    }
    case 'DRAW': {
      var {
        pixelBuffer,
        aBuffer,
        bBuffer,
        offsetThresholds,
        colours,
        size,
        globalAlpha
        // mask
      } = data;
      colourTargets = colours;
      if (!frameColours.length) {
        frameColours = colourTargets;
      }
      frameColours = frameColours.map((col, colIndex) =>
        transform(col, colourTargets[colIndex], 0.05)
      );

      // console.log(colours, frameColours);
      var newBuffer = draw(
        pixelBuffer,
        aBuffer,
        bBuffer,
        offsetThresholds,
        frameColours,
        size,
        globalAlpha
        // mask
      );
      // console.log('tick');

      self.postMessage({
        type: 'DRAW',
        data: {
          buffer: newBuffer,
          bg: frameColours[0]
        }
      });
    }
  }
});

function onDrag(offset, movement) {
  return offset.map((coord, dimension) =>
    Math.round((coord * scaleFactor - movement[dimension]) / scaleFactor)
  );
}
function transform(current, target, easing) {
  return current.map((val, dim) => val + (target[dim] - val) * easing);
}
function draw(
  pixelBuffer,
  aBuffer,
  bBuffer,
  offsetThresholds,
  palette,
  [width, height]
) {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      var a = aBuffer[y][x];
      var b = bBuffer[y][x];
      var value = Math.pow(1 - Math.max(0, Math.min(a - b, 1)), 1.5); // 0 to 1

      var rgb = interpolateColour(value, palette, offsetThresholds);

      var pixelIndex = (x + y * width) * 4;
      pixelBuffer.data[pixelIndex + 0] = rgb[0]; // red
      pixelBuffer.data[pixelIndex + 1] = rgb[1]; // green
      pixelBuffer.data[pixelIndex + 2] = rgb[2]; // blue
      pixelBuffer.data[pixelIndex + 3] = 255; // alpha
    }
  }

  return pixelBuffer;
}
function interpolateColour(value, palette, offsetThresholds) {
  if (value < offsetThresholds[0]) return palette[0];
  if (value >= offsetThresholds[offsetThresholds.length - 1])
    return palette[offsetThresholds.length - 1];

  var rgb = palette[0];
  var startValue = 0;
  var endValue = 0;
  var startColour = palette[0];
  var endColour = palette[0];

  for (let i = 0; i < offsetThresholds.length; i++) {
    if (value <= offsetThresholds[i + 1]) {
      startValue = offsetThresholds[i];
      endValue = offsetThresholds[i + 1];

      startColour = palette[i];
      endColour = palette[i + 1];
      break;
    }
  }

  var valueRange = endValue - startValue;
  var progress = (value - startValue) / valueRange;
  var rgbRange = endColour.map((val, col) => val - startColour[col]);
  rgb = rgbRange.map((range, col) => range * progress + startColour[col]);

  return rgb;
}
