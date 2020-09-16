import React from 'react';
import {View, StyleSheet, Text, Alert} from 'react-native';
import {CheckBox} from 'react-native-elements/src/index';
import DeviceInfo from 'react-native-device-info';
import ValueComponent from '../sharedComponents/Value';
import Tooltip from '../sharedComponents/Tooltip';
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome5';
export default class SelectBox extends ValueComponent {
  constructor(props) {
    super(props);

    this.getInitialValue = this.getInitialValue.bind(this);
    this.selectBoxes = this.selectBoxes.bind(this);
    this.getElements = this.getElements.bind(this);
    this.getValueDisplay = this.getValueDisplay.bind(this);
    this.onChangeItems = this.onChangeItems.bind(this);
  }

  getInitialValue() {
    return {};
  }

  onChangeItems(item) {
    const selectedItems =
    this.state.value && this.state.value.item ? this.state.value.item : [];
  const isSelected = Object.keys(selectedItems).find(i => i === item.value);
  if (isSelected && selectedItems[isSelected] === true) {
    selectedItems[item.value] = false;
  } else {
    selectedItems[item.value] = true;
  }
  this.setValue(selectedItems);
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
          flex: 1,
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

  selectBoxes() {
    const {component} = this.props;
    const boxesStyles = StyleSheet.create({
      boxesWrapper: {
        flex: 1,
        flexDirection: component.inline ? 'row' : 'column',
        marginHorizontal: component.inline ? 20 : 0,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderColor: this.props.colors.borderColor,
      },
      checkbox: {
        // eslint-disable-line react-native/no-color-literals
        backgroundColor: 'transparent',
        zIndex: 0,
        margin: 0,
        borderWidth: 0,
      },
    });

    return (
      <View style={boxesStyles.boxesWrapper}>
        {component.values.map(item => {
           console.log("from onchangeitem222"+JSON.stringify(selectedItems));
        //  alert("items"+JSON.stringify(item));
          const selectedItems =
            this.state.value && this.state.value.item
              ? this.state.value.item
              : [];
          const isSelected = Object.keys(selectedItems).find(
            i => i === item.value,
          );
          const isChecked = isSelected && selectedItems[isSelected] === true;
          const onSelect = () => this.onChangeItems(item);

          return (
            <CheckBox
              key={item.label}
              title={item.label}
              checkedIcon="check-square"
              uncheckedIcon="square-o"
              containerStyle={boxesStyles.checkbox}
              size={26}
              iconRight={component.optionsLabelPosition === 'left'}
              checkedColor={this.props.colors.primary1Color}
              uncheckedColor={this.props.colors.primary1Color}
              checked={isChecked}
              onIconPress={onSelect}
            />
          );
        })}
      </View>
    );
  }

  getElements() {
    const multiStyles = StyleSheet.create({
      fieldWrapper: {
        flex: 1,
        padding: 15,
      },
      //mainElement: this.elementLayout(this.props.component.labelPosition),
      /*labelWrapper: {
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
      },*/
      label: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
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
    const {component} = this.props;
    const selectBoxStyle = StyleSheet.create({
      wrapper: {
        flex: 1,
        marginHorizontal: 15,
        marginTop: 20,
      },
      label: {
        flexWrap: 'wrap',
        color: this.props.theme.Label.color,
        fontSize: DeviceInfo.isTablet() ? this.props.theme.Label.fontSize : 12,
      },
      mainElement: this.elementLayout(this.props.component.labelPosition),
      labelWrapper: {
        flexDirection: 'row',
        marginBottom: this.props.component.labelPosition === 'top' ? 10 : 0,
        marginTop: this.props.component.labelPosition === 'bottom' ? 10 : 0,
        marginRight:
          this.props.component.labelPosition === 'left-left' ||
          this.props.component.labelPosition === 'left-right'
            ? 10
            : 0,
        marginLeft:
          this.props.component.labelPosition === 'right-left' ||
          this.props.component.labelPosition === 'right-right'
            ? 10
            : 0,
      },
      descriptionText: {
        fontSize: DeviceInfo.isTablet() ? 12 : 10,
        marginLeft: 20,
        marginTop: 10,
      },
    });

    const isRequired = component.validate && component.validate.required;
    const gotLabel = !(
      component.hideLabel === true ||
      component.label === '' ||
      !component.label
    );

    const inputLabel = gotLabel ? (
      <View 
      style={multiStyles.label}
      >
        <Text style={{marginLeft:2}}>{component.label}</Text>
        {isRequired && gotLabel ? (
          <FontAwesomeIcon 
          style={multiStyles.requiredIcon} 
          name="asterisk" />
        ) : null}
      </View>
    ) : null;

 /*   const inputLabel = (
      <Text labelStyle={selectBoxStyle.label}>
        {component.label && !component.hideLabel ? component.label : ''}
        {!component.label && component.validate && component.validate.required
          ? '*'
          : ''}
      </Text>
    );*/
    const data = this.state || {};
  //  const error = !(this.state.isPristine || data.isValid);
    const error= data.isValid== false || this.state.isPristine==true?true:false
    //alert(this.state.isPristine || data.isValid );
    //const Element = this.getSingleElement(data, 0, error);
    const errorText = error ? <Text style={{fontWeight:'bold'}}>{data.errorMessage}</Text> : null;

//console.log("aaa"+JSON.stringify(this.state));

    return (
      <View style={{
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
      }}>
       
        <View style={selectBoxStyle.mainElement}>
          <View style={selectBoxStyle.labelWrapper}>
   
            {inputLabel}
            {component.tooltip 
            ? 
              <Tooltip
                text={component.tooltip}
                color={this.props.colors.alternateTextColor}
                backgroundColor={this.props.colors.primary1Color}
              />
            :
            null
            
            
            }
          </View>
          {this.selectBoxes()}

        </View>
       
        {component.description ? (
          <Text style={selectBoxStyle.descriptionText}>
            {component.description}
          </Text>
        ):null}
      </View>
    );
  }

  getValueDisplay(component, data) {
    if (!data) {
      return '';
    }

    return Object.keys(data)
      .filter(key => data[key])
      .map(data => {
        component.values.forEach(item => {
          if (item.value === data) {
            data = item.label;
          }
        });
        return data;
      })
      .join(', ');
  }
}
