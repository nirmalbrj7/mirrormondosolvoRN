import React from 'react';
import { TextInput } from 'react-native';
import InputComponent from '../sharedComponents/Input';
import styles from '../styles/InputSingleLine-styles';

export default class Number extends InputComponent {
  constructor(props) {
    super(props);
    this.onChangeText = this.onChangeText.bind(this);
    this.getSingleElement = this.getSingleElement.bind(this);
  }

  onChangeText(index, value) {
    this.setValue(value, index);
  }

  getSingleElement(value, index) {
    const {
      component, name, readOnly, colors, theme,
    } = this.props;
    const fieldValue = typeof value === 'object' ? value.item : value;
    index = index || 0;
    return (
      <TextInput// Mask
        key={index}
        id={component.key}
        data-index={index}
        name={name}

        value={fieldValue}
        defaultValue={fieldValue}
        placeholder={component.placeholder}

        disabled={!readOnly}

        // type={'only-numbers'}

        keyboardType="numeric"

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
