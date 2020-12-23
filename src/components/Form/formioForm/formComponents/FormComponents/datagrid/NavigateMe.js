import * as React from 'react';
import { Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const MyBackButton=(props)=> {

    const mycomp=props.mycomp
   // const e=props.e;
    const add=props.add;
    const state=props.state
  const navigation = useNavigation();

  onConfirm=(mycomp, index, param, currentState)=> {
    let prevData = currentState.value;
    let prevDatArray = prevData.item;
    if (prevDatArray) {
      if (prevDatArray[0]) {
        if (prevDatArray[0].length == 0) {
          prevDatArray = prevDatArray.filter(value => JSON.stringify(value) !== '[]');

        }
      }
    }

    if (prevDatArray == undefined) {
      var myarray = [];
      var myobj = {};
      mycomp.map((value, index) => {
        console.log("VAL" + JSON.stringify(value));

        myobj.id = Math.random();
        myobj[value.key] = '';

      });
      myarray.push(myobj);
      this.setValue(myarray, index);
    }
    else {
      //  alert(JSON.stringify(prevDatArray));
      const key = this.props.component.key;
      const data = this.props.data;
      const newstate = this.state;
      var myobj = {};

      mycomp.map((value, index) => {
        console.log("VAL2" + JSON.stringify(value));

        myobj.id = Math.random();
        myobj[value.key] = '';

      });


      if (typeof prevDatArray == 'string') {
        prevDatArray = [];
      }
      prevDatArray.push(myobj);
      this.setValue(prevDatArray, index);
     
    }

  }




//  navigation.navigate('ListRecord');
  return (
    <Button
    title="Back"
    onPress={(e) => this.onConfirm(mycomp, 'e', 'add', state)}
  />
  );
}

export default MyBackButton;