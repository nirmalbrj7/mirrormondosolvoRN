import React from 'react';
import { TextInputMask } from 'react-native-masked-text';
import InputComponent from '../sharedComponents/Input';
import styles from '../styles/InputSingleLine-styles';
export default class Currency extends InputComponent {
  constructor(props) {
    super(props);
    this.onChangeText = this.onChangeText.bind(this);
    this.getSingleElement = this.getSingleElement.bind(this);
  }

  onChangeText(index, value) {
    this.setValue(value, index);
  }

  getSingleElement(value, index = 0) {
    const {
      component,
      name,
      readOnly,
      colors,
      theme,
    } = this.props;

    const fieldValue = (value && typeof value === 'object'
    && value.constructor === Object)
      ? value.item
      : value;

    return (
      <TextInputMask
        key={index}
        id={component.key}
        data-index={index}
        name={name}
        value={fieldValue}
        defaultValue={fieldValue}
        placeholder={component.placeholder}
        disabled={!readOnly}
        type="money"
        options={{
          unit: 'US$ ',
        }}
        onChange={this.onChange}
        style={[
          styles.inputSingleLine,
          {
            borderColor: colors.borderColor,
            lineHeight: theme.Input.lineHeight,
          },
        ]}
      />
    );
  }
}
