import React from 'react';
import {View, Text, StyleSheet, Alert} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import {Dropdown} from 'react-native-material-dropdown';
import MultiSelect from 'react-native-multiple-select';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import PropTypes from 'prop-types';
import DeviceInfo from 'react-native-device-info';
import ValueComponent from './Value';
import Tooltip from './Tooltip';
import colors from '../../../defaultTheme/colors';
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome5';
export default class SelectComponent extends ValueComponent {
  constructor(props) {
    super(props);
    this.data = {...this.props.data};
    this.state = {
      selectItems: [],
      searchTerm: '',
      hasNextPage: false,
      open: false,
    };
    this.willReceiveProps = this.willReceiveProps.bind(this);
    this.onChangeSelect = this.onChangeSelect.bind(this);
    this.onSearch = this.onSearch.bind(this);
    this.valueField = this.valueField.bind(this);
    this.getElements = this.getElements.bind(this);
    this.onToggle = this.onToggle.bind(this);
  }

  willReceiveProps(nextProps) {
    if (this.props.component.refreshOn && !nextProps.formPristine) {
      const {refreshOn} = this.props.component;
      this.refresh = false;
      if (refreshOn === 'data') {
        if (!isEqual(this.data, nextProps.data)) {
          this.refresh = true;
        }
      } else if (
        (!this.data.hasOwnProperty(refreshOn) &&
          nextProps.hasOwnProperty(refreshOn)) ||
        this.data[refreshOn] !== nextProps.data[refreshOn]
      ) {
        this.refresh = true;
      } else if (
        nextProps &&
        nextProps.row &&
        nextProps.row.hasOwnProperty(refreshOn) &&
        this.props.row[refreshOn] !== nextProps.row[refreshOn]
      ) {
        this.refresh = true;
      }
      if (this.refresh && this.props.component.clearOnRefresh) {
        this.setValue(this.getDefaultValue());
      }
    }
    if (this.refresh) {
      this.refreshItems();
      this.refresh = false;
    }
    this.data = {...nextProps.data};
  }

  valueField() {
    let valueFieldItem = this.props.component.valueProperty || 'value';
    if (typeof this.getValueField === 'function') {
      valueFieldItem = this.getValueField();
    }
    return valueFieldItem;
  }

  onChangeSelect(selected) {
    
    let value;
    if (this.props.component.multiple) {
      value = this.state.selectItems
        .filter(i => selected.includes(i.label))
        .map(i => i.value);
    } else {
      value = selected;
    }
    if (Array.isArray(value) && this.valueField()) {
      console.log("aaaaaaaaaaa");
      value.forEach((val, index) => {
        value[index] =
          typeof val === 'object' ? get(val, this.valueField()) : val;
      });
    } else if (typeof value === 'object' && this.valueField()) {
     

      if (this.props.component.data.resource) {

      }
      else{
        value = get(value, this.valueField());
      }
     
     
    }  
    
    this.setValue(value);
  }

  onSearch(text) {
    this.setState({
      searchTerm: text,
    });
    if (typeof this.refreshItems === 'function') {
      this.refreshItems(text);
    }
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

  onToggle(isOpen) {
    this.props.onEvent('selectToggle', this, isOpen);
    this.setState(prevState => {
      prevState.open = isOpen;
      return prevState;
    });
  }

  getElements() {
    const selectStyle = StyleSheet.create({
      wrapper: {
        flex: 1,
        marginHorizontal: 15,
        marginTop: 20,
      },
      container: {
        zIndex: 1000,
      },
      containerSingle: {
        flex: 1,
        marginTop: 0,
        marginBottom: 15,
      },
      inputContainer: {
        padding: 0,
      },
      label: {
        color: this.props.theme.Label.color,
        fontSize: DeviceInfo.isTablet() ? this.props.theme.Label.fontSize : 12,
      },
      mainElement: this.elementLayout(this.props.component.labelPosition),
      labelWrapper: {
        flexDirection: 'row',
        marginTop:
          this.props.component.labelPosition === 'top' ||
          this.props.component.labelPosition === 'bottom'
            ? 0
            : 40,
        marginRight:
          this.props.component.labelPosition === 'left-left' ||
          this.props.component.labelPosition === 'left-right'
            ? 0
            : 0,
      },
      list: {
        backgroundColor: colors.mainBackground,
      },
      descriptionText: {
        fontSize: DeviceInfo.isTablet() ? 12 : 10,
        marginLeft: 15,
        marginTop: 10,
      },
    });

    const {component} = this.props;
    const labelText =
      component.label && !component.hideLabel ? component.label : '';
    const requiredInline =
      component.label && component.validate && component.validate.required ? (
        <FontAwesomeIcon 
        style={{
          marginHorizontal: 10,
          color: 'red',
          marginLeft:5
        }} 
        name="asterisk" />

      ) : (
        ''
      );
    const multiMode = component.multiple;
    let values;
    let Element;

    const inputLabel = labelText ? (
      <Text>
       
        {component.label}
        {requiredInline}
      </Text>
    ) : null;
  

    if (multiMode) {
      values =
        this.state.value && this.state.value.item
          ? this.state.selectItems.filter(i =>
              this.state.value.item.includes(i.value),
            )
          : [];
      Element = (
        <MultiSelect
          hideTags
          hideSubmitButton
          fixedHeight
          items={this.state.selectItems}
          uniqueKey="label"
          displayKey="label"
          selectText={component.placeholder}
          showDropDowns
          readOnlyHeadings
          onSelectedItemsChange={this.onChangeSelect}
          selectedItems={values.map(v => v.label)}
          tagRemoveIconColor={this.props.colors.primary1Color}
          selectedItemTextColor={this.props.colors.primary1Color}
          selectedItemIconColor={this.props.colors.primary1Color}
        />
      );
    } else {
      values = this.state.value ? this.state.value.item : '';
      Element = (
        <Dropdown
          label={component.placeholder}
          data={this.state.selectItems}
          disabled={this.props.readOnly}
          style={selectStyle.label}
          inputContainerStyle={selectStyle.inputContainer}
          dropdownOffset={{top: 40, left: 5}}
          containerStyle={selectStyle.containerSingle}
          itemTextStyle={selectStyle.listText}
          value={values}
          onChangeText={this.onChangeSelect}
          labelFontSize={18}
        />
      );
    }
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
        <View style={selectStyle.mainElement}>
          <View style={selectStyle.labelWrapper}>
  
            {inputLabel}          
            {component.tooltip ? (
              <Tooltip
                text={component.tooltip}
                color={this.props.colors.alternateTextColor}
                backgroundColor={this.props.colors.primary1Color}
                styles={{
                  icon: {
                    marginTop:
                      this.props.component.labelPosition === 'top' ||
                      this.props.component.labelPosition === 'bottom'
                        ? 0
                        : 12,
                    marginLeft:
                      this.props.component.labelPosition === 'top' ||
                      this.props.component.labelPosition === 'bottom'
                        ? -15
                        : -20,
                  },
                }}
              />
            )
          
          :null
          }
          </View>   
          {Element}
        </View>
        {component.description? (
          <Text style={selectStyle.descriptionText}>
            {component.description}
          </Text>
        )
      :null
      }
      </View>
    );
    
  }
}

SelectComponent.propTypes = {
  data: PropTypes.any,
  component: PropTypes.any,
  row: PropTypes.object,
  readOnly: PropTypes.bool,
  value: PropTypes.any,
  onEvent: PropTypes.func,
};
