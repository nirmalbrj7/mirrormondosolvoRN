import React from 'react';
import {
  View, TouchableOpacity, TextInput, ScrollView, StyleSheet,
} from 'react-native';
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
    if (value && value.description) {
      formattedValue.formatted_address = value.description;
    }
    this.onChange(formattedValue, 'address');
  }

  getSingleElement(value, index) {
    const {
      component, name, readOnly, colors, theme,
    } = this.props;

    const isSelected = value && value.item && value.item.description;

    return (
      <GoogleAutoComplete
        apiKey={component.map.key}
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
              value={isSelected ? `${value.item.description} ✅` : inputValue}
              onChangeText={handleTextChange}
              placeholder="Address..."
              onFocus={() => this.onChangeAddress(null)}
            />
            {!!locationResults.length && (
            <ScrollView nestedScrollEnabled style={styles.locationList}>
              {locationResults.map((el) => (
                <LocationsListItem
                  key={el.id}
                  data={el}
                  onPress={(val) => {
                    handleTextChange(val.description);
                    this.onChangeAddress(val);
                  }
                }
                />
              ))}
            </ScrollView>
            )}
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
