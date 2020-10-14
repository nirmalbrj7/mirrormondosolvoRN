import React from 'react';
import { TextInputMask } from 'react-native-masked-text';
import { Input } from 'react-native-elements';
import InputComponent from '../sharedComponents/Input';

import styles from '../styles/InputSingleLine-styles';

export default class PhoneNumber extends InputComponent {
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
    const disable=this.props.readOnly==true?true:false;

    const disablestyle=[
      styles.inputSingleLine,
      {
        borderColor: colors.borderColor,
        lineHeight: theme.Input.lineHeight,
        backgroundColor:'lightgray'
      },
    ];
    return (
      <TextInputMask
        key={index}
        id={component.key}
        data-index={index}
        name={name}

        value={fieldValue}
        defaultValue={fieldValue}
        placeholder={component.placeholder}

        disabled={disable}

        type="cel-phone"

        onChange={this.onChange}
        style={disable==true?disablestyle:
          [
            styles.inputSingleLine,
            {
              borderColor: colors.borderColor,
              lineHeight: theme.Input.lineHeight,
            },
          ]
      }
      
      />
    );
  }
}
