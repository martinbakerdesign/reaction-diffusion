export default class ControlToggle {
  constructor(container) {
    this.state = container.dataset.show === 'true';
    this.dom = {
      container,
      button: container.querySelector('.controls__toggle')
    };
    this.labels = ['Controls', 'Hide'];

    this.init();
  }
  init = function() {
    this.watch();
  };
  watch = function() {
    this.dom.button.addEventListener('click', this.toggle.bind(this));
  };
  toggle = function() {
    this.state = !this.state;

    this.updateDom();
  };
  updateDom = function() {
    this.updateLabel();
    this.updateContainer();
  };
  updateLabel = function() {
    var label = this.labels[this.state ? 1 : 0];
    this.dom.button.innerHTML = label;
  };
  updateContainer = function() {
    this.dom.container.dataset.show = this.state;
  };
}
