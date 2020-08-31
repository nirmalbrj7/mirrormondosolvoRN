import { clone } from 'lodash';
import PropTypes from 'prop-types';
import MultiComponent from './Multi';

export default class InputComponent extends MultiComponent {
  constructor(props) {
    super(props);
    this.timeout = null;

    this.triggerChange = this.triggerChange.bind(this);
    this.onChangeInput = this.onChangeInput.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.getInputMask = this.getInputMask.bind(this);
    this.getSingleElement = this.getSingleElement.bind(this);
  }

  static customState(state) {
    state.hasChanges = false;
    return state;
  }

  triggerChange() {
    if (typeof this.props.onChange === 'function' && this.state.hasChanges) {
      this.props.onChange(this);
      this.setState({
        hasChanges: false,
      }, () => this.props.onChange(this));
    }
  }

  onChangeInput(value, id) {
    if (typeof this.onChangeCustom === 'function') {
      value = this.onChangeCustom(value);
    }

    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      this.triggerChange();
    }, 500);

    let newValue;
    if (Array.isArray(this.state.value)) {
      // Clone so we keep state immutable.
      newValue = clone(this.state.value);
    } else {
      newValue = value;
    }
    const validatedValue = this.validate(newValue);
    if (id) {
      this.setState({
        isPristine: false,
        hasChanges: true,
        value: validatedValue,
        cardId: '23333'
      });
    } else {
      this.setState({
        isPristine: false,
        hasChanges: true,
        value: validatedValue,
      });
    }

  }

  onBlur() {
    this.triggerChange();
  }

  /**
   * Returns an input mask that is compatible with the input mask library.
   * @param {string} mask - The Form.io input mask.
   * @returns {Array} - The input mask for the mask library.
   */
  getInputMask(mask) {
    /* if (typeof this.customMask === 'function') {
      return this.customMask();
    } */
    if (!mask) {
      return false;
    }
    if (mask instanceof Array) {
      return mask;
    }
    const maskArray = [];
    for (let i = 0; i < mask.length; i++) {
      switch (mask[i]) {
        case '9':
          maskArray.push(/\d/);
          break;
        case 'a':
        case 'A':
          maskArray.push(/[a-zA-Z]/);
          break;
        case '*':
          maskArray.push(/[a-zA-Z0-9]/);
          break;
        default:
          maskArray.push(mask[i]);
          break;
      }
    }
    return maskArray;
  }
}

InputComponent.propTypes = {
  component: PropTypes.any,
  name: PropTypes.string,
  theme: PropTypes.object,
  readOnly: PropTypes.bool,
  onChange: PropTypes.func,
};
