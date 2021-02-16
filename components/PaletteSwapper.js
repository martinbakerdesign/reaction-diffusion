export default class PaletteSwapper {
  constructor(onInterval, interval = 10000) {
    this.intervalDuration = interval;
    this.palette = 0;
    this.palettes = [
      [
        [4, 0, 8],
        [25, 12, 35],
        [98, 0, 25]
      ],
      [
        [98, 0, 25],
        [4, 0, 8],
        [25, 12, 35]
      ],
      [
        [25, 12, 35],
        [98, 0, 25],
        [4, 0, 8]
      ]
    ];
    this.onInterval = onInterval;
    this.start();
  }
  start = function() {
    setInterval(() => {
      this.togglePalette();
      this.onInterval(this.palettes[this.palette]);
    }, this.intervalDuration);
  };
  togglePalette = function() {
    this.palette = (this.palette + 1) % this.palettes.length;
  };
}
