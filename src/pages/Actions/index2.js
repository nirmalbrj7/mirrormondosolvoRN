import React, { Component } from 'react'
import { Text, View, Alert } from 'react-native'
import firestore from '@react-native-firebase/firestore';
var aaa = [];

export class index extends Component {
 
  
  async componentDidMount() {
    let formSlug = ["aaa"];
    let mainData = ["bbb"];


    const querySnapshot = await firestore()
      .collection('submissions')
      .get();
    querySnapshot.forEach(async documentSnapshot => {
      this.formSlug.push(documentSnapshot.id)

      const querySnapshot = await firestore().collection('submissions')
        .doc(documentSnapshot.id)
        .collection('submissionData')
        .get()

      querySnapshot.forEach(documentSnapshot => {
        console.log("here");
        this.mainData.push(documentSnapshot.id)


      });


    });



    console.log("formslug" + JSON.stringify(formSlug));
    console.log("mainData" + JSON.stringify(mainData));

  }
  render() {
    return (
      <View>
                <Text>form {JSON.stringify(formSlug)} </Text>
        <Text>main {JSON.stringify(this.state.mainData)} </Text>
      </View>
    )
  }
}

export default index
