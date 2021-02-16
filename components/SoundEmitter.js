import Vector3 from './Vector3.js';

const audioOptions = {
  autoplay: false,
  // volume: 0,
  loop: true,
  // rate: 0.5,
  autoSuspend: true
};

export default class SoundEmitter {
  constructor(src, coords = [0, 0], [vW, vH]) {
    this.sound = new Howl({
      src,
      volume: 0,
      ...audioOptions
    });
    this.soundId = '';

    this.pos = new Vector3([...coords, 0.5]);

    this.init([vW, vH]);
  }
  init = function([vW, vH]) {
    this.soundId = this.sound.play();
    this.sound.on('play', this.onPlay([vW, vH]).bind(this));
  };
  onPlay = function([vW, vH]) {
    return () => {
      var {
        v: [x, y, z]
      } = this.pos;
      var id = this.soundId;
      this.sound.volume(0.5, id);
      this.sound.pos(Math.round(x), Math.round(y), Math.round(z), id);
      // this.sound.orientation(0, 0, 0, id);

      this.onResize([vW, vH]);
    };
  };
  tick = function(newPos) {
    var {
      v: [x, y, z]
    } = this.pos;

    if (newPos != null) this.setPos(newPos);

    this.sound.pos(x, y, z, this.soundId);
  };
  setPos = function(newPos) {
    this.pos.set([...newPos, 0.5]);
  };
  onResize = function([vW, vH]) {
    var rolloffFactor = 32;
    var rad = Math.floor((vW + vH) / rolloffFactor);

    this.sound.pannerAttr(
      {
        panningModel: 'HRTF', // 'equalpower' or 'HRTF'
        refDistance: rad,
        distanceModel: 'exponential',
        rolloffFactor: 0.75
      },
      this.soundId
    );
  };
}
