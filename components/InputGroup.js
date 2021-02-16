import Input from './Input.js';

export default class InputGroup {
  constructor(inputs, changeCallback, value = 0) {
    this.dom = inputs;
    this.value = value;
    this.comps = this.initComps();

    this.handleChange = changeCallback;
  }
  initComps = function() {
    var changeCallback = this.onChange.bind(this);
    var initValue = this.value;
    var comps = this.dom.map(
      input => new Input(input, changeCallback, initValue)
    );

    return comps;
  };
  onChange = function(newValue) {
    this.setValue(newValue);
    this.updateInputs();

    this.handleChange(newValue);
  };
  setValue = function(newValue) {
    this.value = newValue;
  };
  getValue = function() {
    return this.value;
  };
  updateInputs = function() {
    var newValue = this.value;
    this.comps.forEach(inputComp => inputComp.setValue(newValue));
  };
}
