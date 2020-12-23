import React from 'react';
import { View, Text, PermissionsAndroid,Pressable } from 'react-native';
import { Button } from 'react-native-paper';
import InputComponent from '../sharedComponents/Input';
import GetLocation from 'react-native-get-location'
import Geolocation from '@react-native-community/geolocation';
export default class Location extends InputComponent {
  constructor(props) {
    super(props);
    this.onChangeText = this.onChangeText.bind(this);
    this.getSingleElement = this.getSingleElement.bind(this);
  }

  async onChangeText() {

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
       
        Geolocation.getCurrentPosition(
          position => {
            //alert(JSON.stringify('postion'+JSON.stringify(position)));
            const initialPosition = position.coords;
     
           // console.log("initial"+initialPosition);
           // this.setState({initialPosition});
            this.setValue(initialPosition.latitude + ',' + initialPosition.longitude);
          },
          error => Alert.alert('Error', JSON.stringify(error)),
          {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000},
        );
      } else {
       // alert(JSON.stringify('7'));
        console.log("Camera permission denied");
      }
    } catch (err) {
      //alert('8'+JSON.stringify(err));
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





        <Button style={{ alignSelf: 'center', width: 250,borderWidth:2,borderColor:'red' }}
        labelStyle={{color:'red'}}
        uppercase={false}
        icon="enviroment" mode="outlined" onPress={async ()=> await this.onChangeText()}>
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
