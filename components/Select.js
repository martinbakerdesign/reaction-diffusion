export default class Select {
  constructor(dom, presets, changeCallback, initVal = null) {
    this.select = dom;
    this.presets = presets;
    this.state = {
      value: initVal || null
    };
    this.changeCallback = changeCallback;
    this.init();
  }
  init = function() {
    this.populate();

    if (this.state.value) {
      this.setValue(this.state.value);
    } else {
      this.setValue(Object.keys(this.presets)[0]);
    }

    this.watch();
  };
  watch = function() {
    this.select.addEventListener('change', this.onChange.bind(this));
  };
  populate = function() {
    var { presets, select } = this;

    Object.keys(presets).forEach(key => {
      var option = document.createElement('option');
      option.value = key;
      option.innerHTML = key;

      select.appendChild(option);
    });
  };
  setValue = function(newValue) {
    this.state.value = newValue;
    this.select.value = newValue;
  };
  onChange = function({ target: { value } }) {
    this.state.value = value;

    this.changeCallback(value);
  };
}
