import React from 'react';
import {StyleSheet} from 'react-native';
import BaseComponent from '../sharedComponents/Base';
import {Button as ButtonElement} from 'react-native-elements/src/index';
import DeviceInfo from 'react-native-device-info';

export default class Button extends BaseComponent {
  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
    this.getButtonType = this.getButtonType.bind(this);
  }
  getButtonType() {
    switch (this.props.component.action) {
      case 'submit':
      case 'saveState':
        return 'submit';
      case 'reset':
        return 'reset';
      case 'event':
      case 'oauth':
      default:
        return 'button';
    }
  }
  onClick(event) {
    this.props.onSubmit(event);
    //this.props.onSubmit(event);
    /*if (this.props.readOnly) {
      event.preventDefault();
      this.props.resetForm();
      return;
    }
    if(!this.props.component.action){
      alert("submit")
      this.props.onSubmit(event);
    }*/
   // alert('submit'+JSON.stringify(this.props.component))
   /* switch (this.props.component.action) {
      
      case 'submit':
     
        this.props.onSubmit(event);
        break;
      case 'saveState':
        this.props.onSave(event);
        break;
      case 'event':
        this.props.onEvent(this.props.component.event);
        break;
      case 'oauth':
     
        console.warn(
          'You must add the OAuth button to a form for it to function properly',
        );
       
        break;
      case 'delete':
        this.props.onEvent('deleteSubmission');
        break;
      case 'reset':
        event.preventDefault();
        this.props.resetForm();
        break;
    }*/
  }

  render() {
    const {component} = this.props;
    let buttonWidth;
    if (component.block) {
      buttonWidth = '100%';
    } else {
      buttonWidth = DeviceInfo.isTablet() ? 250 : 150;
    }
    const styles = StyleSheet.create({
      button: {
        width: buttonWidth,
        alignSelf: 'center',
        marginHorizontal: 10,
        paddingHorizontal: component.block ? 20 : 0,
        marginTop: 20,
        marginBottom: 10,
      },
    });

    const getIconName = value => value.split(' ')[1].split('-')[1];
    const disabled =
      this.props.readOnly ||
      this.props.isSubmitting ||
      (component.disableOnInvalid && !this.props.isFormValid);
    const submitting = this.props.isSubmitting && component.action === 'submit';

    const leftIcon = component.leftIcon
      ? {name: getIconName(component.leftIcon), type: 'font-awesome'}
      : null;
    const rightIcon = component.rightIcon
      ? {name: getIconName(component.rightIcon), type: 'font-awesome'}
      : null;
      if (component.hasOwnProperty("customConditional")) {
        return (

          <ButtonElement
            containerStyle={styles.button}
            backgroundColor={this.props.colors.primary1Color}
            title={component.label}
            leftIcon={leftIcon}
            rightIcon={rightIcon}
            type={'solid'}
            disabled={disabled}
            onPress={this.onClick}
            loading={submitting}
          />
        );
      }
    return null;
  }
}
