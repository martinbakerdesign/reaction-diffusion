export default class Input {
  constructor(input, changeCallback, value = 0) {
    this.value = value;
    this.dom = input;
    this.changeCallback = changeCallback;

    this.init();
  }
  init = function() {
    this.updateDom();
    this.watch();
  };
  watch = function() {
    const { dom } = this;
    dom.addEventListener('keyup', this.onChange.bind(this));
    dom.addEventListener('change', this.onChange.bind(this));
  };
  onChange = function({ target: { value } }) {
    var newValue = parseFloat(value);
    this.setValue(newValue);

    this.changeCallback(newValue);
  };
  setValue = function(newValue) {
    this.value = newValue;

    if (this.dom.value !== newValue) {
      this.updateDom();
    }
  };
  getValue = function() {
    return this.state;
  };
  updateDom = function() {
    this.dom.value = this.value;
  };
}
