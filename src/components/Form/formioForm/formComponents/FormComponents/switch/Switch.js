import React from 'react';
import {
  View, Switch, Text, StyleSheet,
} from 'react-native';
import ValueComponent from '../sharedComponents/Value';

export default class SwitchComponent extends ValueComponent {
  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
    this.getElements = this.getElements.bind(this);
    this.getValueDisplay = this.getValueDisplay.bind(this);
  }

  onChange(checked) {
    this.setValue(checked);
  }

  getElements() {
    const switchStyle = StyleSheet.create({
      wrapper: {
        marginTop: 10,
        marginLeft: 15,
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 10,
      },
      label: {
        flex: 1,
        fontSize: 15,
        marginLeft: 10,
        color: this.props.colors.textColor,
        marginBottom: 10
      },
    });

    const { component } = this.props;
    const { value } = this.state;
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

<View style={{
        flex: 1, flexDirection: 'row', marginTop: 10,
        marginLeft: 15, padding: 5
      }}>
        <Switch
          trackColor={this.props.colors.primary1Color}
          value={value.item}
          disabled={this.props.readOnly}
          onValueChange={this.onChange}
        />
        <Text style={switchStyle.label}>
          {!(component.hideLabel && component.datagridLabel === false) ? component.label : ''}
        </Text>
      </View>

      </View>

    );
  }

  getValueDisplay(component, data) {
    return data ? 'Yes' : 'No';
  }
}
