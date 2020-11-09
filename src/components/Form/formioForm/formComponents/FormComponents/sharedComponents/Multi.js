import React from 'react';
import clone from 'lodash/clone';
import PropTypes from 'prop-types';
import { View, StyleSheet } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import Icon from 'react-native-vector-icons/FontAwesome5';

import { Text } from 'react-native-elements/src/index';
import Tooltip from './Tooltip';
import ValueComponent from './Value';

export default class MultiComponent extends ValueComponent {
  constructor(props) {
    super(props);
    this.addFieldValue = this.addFieldValue.bind(this);
    this.removeFieldValue = this.removeFieldValue.bind(this);
    this.getTableRows = this.getTableRows.bind(this);
    this.getElements = this.getElements.bind(this);
  }

  addFieldValue() {
    const value = clone(this.state.value);
    value.push(this.props.component.defaultValue);
    this.setState(
      {
        isPristine: false,
        value,
      },
      () => {
        if (typeof this.props.onChange === 'function') {
          this.props.onChange(this);
        }
      },
    );
  }

  removeFieldValue(id) {
    const value = clone(this.state.value);
    value.splice(id, 1);
    this.setState(
      {
        isPristine: false,
        value,
      },
      () => {
        if (typeof this.props.onChange === 'function') {
          this.props.onChange(this);
        }
      },
    );
  }

  getTableRows(value, id, style) {
    const error = !(this.state.isPristine || value.isValid);
    const Element = this.getSingleElement(value, id, error);
    const errorText = error ? (
      <FormValidationMessage style={style.errorMessage}>
        {' '}
        {value.errorMessage}
      </FormValidationMessage>
    ) : null;
    return (
      <View style={style.fieldWrapper}>
        {Element}
        <Icon
          name="minus-circle"
          type="font-awesome"
          onPress={this.removeFieldValue.bind(null, id)}
        />
        {errorText}
      </View>
    );
  }

  elementLayout(position) {
    switch (position) {
      case 'top':
        return {
          flexDirection: 'column',
        };
      case 'left-left':
      case 'left-right':
        return {
          flexDirection: 'row',
          alignItems: 'flex-start',
        };
      case 'right-left':
      case 'right-right':
        return {
          flexDirection: 'row-reverse',
          marginHorizontal: 20,
        };
      case 'bottom':
        return {
          flexDirection: 'column-reverse',
        };
      default:
        return {
          flexDirection: 'column',
        };
    }
  }

  getElements() {
    const multiStyles = StyleSheet.create({
      fieldWrapper: {
        flex: 1,
        padding: 15,
        backgroundColor:'#fff',
       // borderWidth:1,
       // borderColor:'#000',
        borderRadius:4,
        marginBottom:5,
        marginHorizontal:5,
        shadowColor: "#000",
shadowOffset: {
	width: 0,
	height: 2,
},
shadowOpacity: 0.25,
shadowRadius: 3.84,

elevation: 5,
      },
      mainElement: this.elementLayout(this.props.component.labelPosition),
      labelWrapper: {
        flexDirection: 'row',
        marginTop:
          this.props.component.labelPosition === 'top' ||
            this.props.component.labelPosition === 'bottom'
            ? 0
            : 15,
        marginRight:
          this.props.component.labelPosition === 'left-left' ||
            this.props.component.labelPosition === 'left-right'
            ? 10
            : 0,
      },
      label: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 10,
      },
      errorText: {
        alignSelf: 'flex-end',
        fontSize: 10,
        color: this.props.colors.errorColor,
      },
      descriptionText: {
        fontSize: DeviceInfo.isTablet() ? 12 : 10,
        marginLeft: 20,
        marginTop: 10,
      },
      labelStyle: {
        maxWidth: DeviceInfo.isTablet() ? 580 : 210,
        color: this.props.theme.Label.color,
        fontSize: DeviceInfo.isTablet() ? this.props.theme.Label.fontSize : 12,
      },
      inputWrapper: {
        flexDirection: 'row',
      },
      suffixAndPrefix: {
        alignSelf: 'center',
      },
      requiredIcon: {
        marginHorizontal: 10,
        color: 'red',
      },
    });

    const { component } = this.props;
    let Component;


    const isRequired = component.validate && component.validate.required;
    const gotLabel = !(
      component.hideLabel === true ||
      component.label === '' ||
      !component.label
    );

    const prefix = (
      <Text style={multiStyles.suffixAndPrefix}>{component.prefix}</Text>
    );
    const suffix = (
      <Text style={multiStyles.suffixAndPrefix}>{component.type == 'datetime' ? <Text></Text> : <Text>{component.suffix}</Text>}</Text>
    );

    const inputLabel = gotLabel ? (
      <View style={multiStyles.label}>
        <Text>{component.label}</Text>
        {isRequired && gotLabel ? (
          <Icon style={multiStyles.requiredIcon} name="asterisk" />
        ) : null}
      </View>
    ) : null;

    const data = this.state.value || {};

    /*if (component.multiple) {
      const rows = data.map((value, id) => {
        this.getTableRows(value, id, multiStyles);
      });
      Component = (
        <View>
          <Text h3>{component.label}</Text>
          {rows}
          <Button
            icon={{ name: 'plus', type: 'font-awesome' }}
            onPress={this.addFieldValue}>
            <Text> Add another</Text>

          </Button>
        </View>
      );*/
   // } else {
      const error = !(this.state.isPristine || data.isValid);
      const Element = this.getSingleElement(data, 0, error);
      const errorText = error ? <Text style={{fontWeight:'bold',color:'red'}}>{data.errorMessage}</Text> : null;

      Component = (
        <View style={multiStyles.fieldWrapper}>
       
    
          <View style={multiStyles.mainElement}>
            <View style={multiStyles.labelWrapper}>
              {inputLabel}
              {component.tooltip ? (
                <Tooltip
                  text={component.tooltip}
                  color={this.props.colors.alternateTextColor}
                  backgroundColor={this.props.colors.primary1Color}
                />
              ) : null}
            </View>
            <View style={multiStyles.inputWrapper}>

              {prefix}
              {Element}
              {suffix}
              {isRequired && !gotLabel ? (
                <Icon style={multiStyles.requiredIcon} name="asterisk" />
              ) : null}
            </View>
          </View>
          {errorText}
          {component.description ? (
            <Text style={multiStyles.descriptionText}>
              {component.description}
            </Text>
          ) :
            null

          }

        </View>
      );
   // }
    return Component;
  }
}

MultiComponent.propTypes = {
  component: PropTypes.any,
  onChange: PropTypes.func,
  theme: PropTypes.object,
  colors: PropTypes.object,
};
