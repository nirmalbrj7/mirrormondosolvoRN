import React from 'react';
import { View, Text, PermissionsAndroid } from 'react-native';
import { Button } from 'react-native-paper';
import InputComponent from '../sharedComponents/Input';
import GetLocation from 'react-native-get-location'

export default class Location extends InputComponent {
  constructor(props) {
    super(props);
    this.onChangeText = this.onChangeText.bind(this);
    this.getSingleElement = this.getSingleElement.bind(this);
  }

  async onChangeText(index) {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Data Collection App Location Permission",
          message:
            "Data Collection App needs access to your location " +
            "so we can record your location.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK"
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        GetLocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 150000,
        })
          .then(location => {
            this.setValue(location.latitude + ',' + location.longitude);
          })
          .catch(ex => {
            const { code, message } = ex;
            console.warn(code, message);
            if (code === 'CANCELLED') {
              Alert.alert('Location cancelled by user or by another request');
            }
            if (code === 'UNAVAILABLE') {
              Alert.alert('Location service is disabled or unavailable');
            }
            if (code === 'TIMEOUT') {
              Alert.alert('Location request timed out');
            }
            if (code === 'UNAUTHORIZED') {
              Alert.alert('Authorization denied');
            }

          });
      } else {
        console.log("Camera permission denied");
      }
    } catch (err) {
      console.warn(err);
    }
  }


  getSingleElement(value, index) {
    const {
      component, name, readOnly, colors, theme,
    } = this.props;
    const fieldValue = typeof value === 'object' ? value.item : value;
    index = index || 0;
    let lat = '';
    let long = '';

    if (fieldValue != null && fieldValue != '' && fieldValue !== undefined) {
      lat = fieldValue.split(',')[0];
      long = fieldValue.split(',')[1];
    }
    return (
      <View style={{ flex: 1,marginTop:5 }}>
        <Button style={{ alignSelf: 'center', width: 250 }}
        
        uppercase={false}
        icon="enviroment" mode="outlined" onPress={this.onChangeText}>
          Get Location
        </Button>

        {lat != '' && long != '' ?
          <View >
            <Text style={{ textAlign: 'center' }}>Location has been Taken</Text>
            <View style={{ flexDirection: 'row', alignSelf: 'center' }}>
              <Text>Latitute:<Text style={{fontWeight:'bold'}}>{lat} </Text></Text>
              <Text>Longitude:<Text style={{fontWeight:'bold'}}>{long}</Text></Text>
            </View>


          </View>
          :
          <Text style={{ textAlign: 'center' }}>Press button to record location</Text>
        }
      </View>
    );
  }
}
