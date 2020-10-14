import React from 'react';
import { TextInput } from 'react-native';
import InputComponent from '../sharedComponents/Input';
import styles from './styles';

export default class Textarea extends InputComponent {
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
    console.log("textarea");
    const disable=this.props.readOnly==true?true:false;
    console.log("disable"+disable);
    const disablestyle=[styles.textarea, { 
      borderColor: colors.borderColor, 
      lineHeight: theme.Input.lineHeight,
      backgroundColor:'lightgray' }
    ]
    return (
      <TextInput
        key={index}
        id={component.key}
        data-index={index}
        name={name}
        value={fieldValue}
        defaultValue={fieldValue}
        style={disable==true?disablestyle:
          [styles.textarea, { 
            borderColor: colors.borderColor, 
            lineHeight: theme.Input.lineHeight,
            }
          ]
      }
        multiline
        autoCorrect
        numberOfLines={component.rows}
        disabled={disable}
        editable={disable}
        disabledInputStyle={{backgroundColor:'lightgray'}}
        placeholder={component.placeholder}
        onChange={this.onChange}
      />
    );
  }
}
