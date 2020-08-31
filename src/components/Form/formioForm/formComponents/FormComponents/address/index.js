import React from 'react';
import {View, TouchableOpacity,TextInput,StyleSheet,} from 'react-native';
import PropTypes from 'prop-types';
import { GoogleAutoComplete } from 'react-native-google-autocomplete';
import { Text } from 'react-native-elements';
import InputComponent from '../sharedComponents/Input';
import globalStyles from '../styles/InputSingleLine-styles';

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
    const {component, name, readOnly, colors, theme} = this.props;
    const isSelected = value && value.item && value.item.description;
    return (
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
