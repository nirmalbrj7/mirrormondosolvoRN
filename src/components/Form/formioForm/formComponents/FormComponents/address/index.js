import React from 'react';
import {View, TouchableOpacity,TextInput,StyleSheet,} from 'react-native';
import PropTypes from 'prop-types';
import { GoogleAutoComplete } from 'react-native-google-autocomplete';
import { Text } from 'react-native-elements';
import InputComponent from '../sharedComponents/Input';
import globalStyles from '../styles/InputSingleLine-styles';
import DeviceInfo from 'react-native-device-info';

const LocationsListItem = (props) => {
  const { data, onPress } = props;
  return (
    <View style={styles.proposalListItemWrapper}>
      <TouchableOpacity
        style={styles.proposalsListItemTouchable}
        onPress={() => { onPress(data); }}
      >
        <Text>
          {data.description}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

LocationsListItem.propTypes = {
  data: PropTypes.shape({
    id: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
  }).isRequired,
  onPress: PropTypes.func.isRequired,
};

class Address extends InputComponent {
  constructor(props) {
    super(props);

    this.getSingleElement = this.getSingleElement.bind(this);
    this.onChangeAddress = this.onChangeAddress.bind(this);
  }

  onChangeAddress(value) {
    const formattedValue = Object.assign({}, value);
    this.onChange(value, 'address');
  }

  getSingleElement(value, index) {
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
    const {component, name, readOnly, colors, theme} = this.props;
    const isSelected = value && value.item && value.item.description;
    const isRequired = component.validate && component.validate.required;
    const gotLabel = !(
      component.hideLabel === true ||
      component.label === '' ||
      !component.label
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
    //  const Element = this.getSingleElement(data, 0, error);
      const errorText = error ? <Text>{data.errorMessage}</Text> : null;


    
    return (
      <>

<GoogleAutoComplete
      apiKey="AIzaSyBuE49w8SJ7DmoSlfunZVybPgKmMaVbyQE"
      debounce={300}
      queryTypes="geocode"
    >
      {({
        inputValue, handleTextChange, locationResults,
      }) => (
        <View style={{ flexDirection: 'column', width: '100%' }}>
         
          <TextInput
            style={{
              ...globalStyles.inputSingleLine,
              borderColor: colors.borderColor,
              lineHeight: theme.Input.lineHeight,
            }}
          value={value.item?value.item:value}
            onChangeText={(val)=>this.onChangeAddress(val)}
            placeholder="Address..."
          />
        </View>
      )}
    </GoogleAutoComplete>

 
{errorText}
          {component.description ? (
            <Text style={multiStyles.descriptionText}>
              {component.description}
            </Text>
          ) :
            null

          }


      </>
     
    
    );
  }
}

const styles = StyleSheet.create({
  locationList: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopWidth: 1,
    marginTop: 10,
  },
  proposalsListItemTouchable: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  proposalListItemWrapper: {
    borderBottomWidth: 1,
  },
});

export default Address;
