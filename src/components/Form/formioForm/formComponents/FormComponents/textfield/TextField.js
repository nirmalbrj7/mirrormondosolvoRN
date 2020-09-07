import React from 'react';
import { StyleSheet} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { Input } from 'react-native-elements';
import Location from '../location';
import InputComponent from '../sharedComponents/Input';
import styles from '../styles/InputSingleLine-styles';
import { Component } from 'react';

const LOCATION_KEY = 'location';
export default class Textfield extends InputComponent {
  constructor(props) {
    super(props);
  }
  getSingleElement(value, index, error) {
    const { component: { tags = [] } } = this.props;
    
    if (tags.includes(LOCATION_KEY)) {
      return <Location value={value} onChangeValue={this.onChange} />;
    }
    const themeStyle = this.props.theme.Input;
   
    const style = StyleSheet.create({
      container: {
        borderColor: error ? themeStyle.borderColorOnError : themeStyle.borderColor,
        flex: 1,
        maxWidth: DeviceInfo.isTablet() ? 580 : 210,
        //backgroundColor:this.props.component.disabled==true?'gray':'#ffff'
      },
      input: {
        color: themeStyle.color,
       // color:this.props.component.disabled==true?'gray':themeStyle.color,
        fontSize: themeStyle.fontSize,
        lineHeight: themeStyle.lineHeight,
      },
    });


    index = index || 0;
    const item = typeof value === 'string' ? value : value.item;
    const { component, name, readOnly } = this.props;
    const mask = component.inputMask || '';
    const disable=this.props.component.disabled==true?false:true;
    const properties = {
      disabled:true,
      type: component.inputType !== 'number' ? component.inputType : 'text',
      key: index,
      id: component.key,
      'data-index': index,
      name,
      shake: true,
      defaultValue: item,
      value: item,
      editable: disable,
      placeholder: component.placeholder,
      placeholderTextColor: this.props.theme.Input.placeholderTextColor,
      onChangeText: this.onChangeInput,
      onBlur: this.onBlur,
      ref: input => this.element = input,
    };

    return (
      <Input
        inputStyle={[
          styles.inputSingleLine,
          {
            borderColor: themeStyle.borderColor,
            lineHeight: themeStyle.lineHeight,
          },
        ]}
        containerStyle={styles.inputSingleLineContainer}
        inputContainerStyle={styles.inputSingleLineInputContainer}

        {...properties}
      />
    );
  }
}
