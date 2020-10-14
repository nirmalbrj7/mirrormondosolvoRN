import React from 'react';
import { Input } from 'react-native-elements';
import InputComponent from '../sharedComponents/Input';
import styles from '../styles/InputSingleLine-styles';
export default class Password extends InputComponent {
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

    return (
      <Input
        key={index}
        id={component.key}
        data-index={index}
        name={name}
        value={fieldValue}
        defaultValue={fieldValue}
        inputStyle={[
          styles.inputSingleLine,
          {
            borderColor: colors.borderColor,
            lineHeight: theme.Input.lineHeight,
          },
        ]}
        containerStyle={styles.inputSingleLineContainer}
        inputContainerStyle={styles.inputSingleLineInputContainer}
        autoCorrect
        disabled={disable}
        disabledInputStyle={{backgroundColor:'lightgray'}}

        placeholder={component.placeholder}
        secureTextEntry
        onChange={this.onChange}
      />
    );
  }
}
