import LandingMap from "./components/LandingMap.js";
import presets from "./presets.js";
import palettes from "./palettes.js";

const presetsLength = Object.keys(presets).length;
const audioRoot = "./assets/";
const audioSrc = [
  "horror-loop.mp3",
  "horror-ambience.mp3",
  "industrial.mp3",
  "space-ship.mp3"
].map(src => `${audioRoot}${src}`);

const artworks = [
  { cell: [3, 0] },
  { cell: [1, 1] },
  { cell: [4, 2] },
  { cell: [0, 3] },
  { cell: [2, 4] },
  { cell: [5, 5] }
].map((a, index) => ({
  ...a,
  audioSrc: audioSrc[Math.floor(Math.random() * audioSrc.length)]
}));
const artworkCount = artworks.length;
// const gridWidth = Math.floor(artworkCount * 1.5);
const gridWidth = artworkCount;
const reactionDiffusionData = new Array(gridWidth).fill(0).map(() =>
  new Array(gridWidth).fill(0).map(() => ({
    rates: Object.values(presets)[Math.floor(Math.random() * presetsLength)],
    palette: palettes[Math.floor(Math.random() * palettes.length)]
  }))
);
const config = {
  artworks
};

/**
 * Run
 */
window.onload = function () {
  var support = {
    webgl2: false,
    webgl: false,
    gpu: false
  };
  try {
    if (GPU.isWebGL2Supported) support.webgl2 = true;
    if (GPU.isWebGLSupported) support.webgl = true;
    if (GPU.isGPUSupported) support.gpu = true;
  } catch (err) {
    console.error("support error: ", err);
  }
  const gpuConfig = {
    mode: support.webgl2
      ? "webgl2"
      : support.webgl
      ? "webgl"
      : support.gpu
      ? "gpu"
      : "cpu"
  };
  console.log("GPU Config Mode: ", gpuConfig.mode);

  const fps = new FPS();
  fps.start();
  const gpuArr = new Array(2).fill(0).map(() => new GPU(gpuConfig));
  const landingMap = new LandingMap({
    gridWidth,
    reactionDiffusionData,
    artworks,
    gpuArr,
    config
  });
};
