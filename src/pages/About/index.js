import React from 'react';
import {ScrollView, View, Text, ActivityIndicator,StyleSheet} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import commonStyles from '../../globalStyles';
import {Avatar,Card,Paragraph} from "react-native-paper";

import Icons from 'react-native-vector-icons/AntDesign';
import Icons2 from 'react-native-vector-icons/FontAwesome';
class About extends React.PureComponent {
  state = {
    aboutText: null,
  };

  aboutDataRef = firestore()
    .collection('settings')
    .doc('about');

  async componentDidMount() {
    this.aboutDataUnsubscribe = this.aboutDataRef.onSnapshot(
      this.onCollectionUpdate,
    );
  }

  componentWillUnmount() {
    this.aboutDataUnsubscribe();
  }

  onCollectionUpdate = documentSnapshot => {
    this.setState({
      aboutText: documentSnapshot.data().aboutText,
    });
  };

  render() {
    const {aboutText} = this.state;

    if (!aboutText) {
      return (
        <View style={commonStyles.loaderScreenCentered}>
          <ActivityIndicator size="large" />
        </View>
      );
    }

    return (
      <ScrollView style={commonStyles.screenContainer}>
        <Card>
          <Card.Content>
          <Avatar.Image style={styles.image}
              source={require('../../assets/images/logo.png')}
              size={80}
            />
            <Text style={{textAlign:'center',fontSize:20,fontWeight:'bold'}}>FormCollector App</Text>
            <Text style={{textAlign:'center',marginTop:5,fontSize:12,color:'gray'}}>Version:0.0.1</Text>

          </Card.Content>
        </Card>

            <Card style={{marginTop:20}}>
              <Card.Content>
                <Paragraph>
                <Text style={{textAlign:'center',marginTop:5,fontSize:13,color:'gray'}}>{aboutText}</Text>
                </Paragraph>
              </Card.Content>
            </Card>
       

            <Card style={{marginTop:20,marginBottom:20}}>
              <Card.Content>
              <Text style={{textAlign:'center',fontSize:20,fontWeight:'bold',marginBottom:20}}>Our Social Media</Text>
                <View style={{flex:1,flexDirection:'row',justifyContent: 'space-around',}}>
                <Icons name="youtube" size={30} color="red" onPress={()=>{ Linking.openURL('https://www.youtube.com/user/BuildChange')}}/>
                <Icons2 name="facebook" size={28} color="blue" onPress={()=>{ Linking.openURL('https://www.facebook.com/BuildChange')}}/>
                  <Icons name="twitter" size={30} color="#1da1f2"  onPress={()=>{ Linking.openURL('https://twitter.com/BuildChange')}}/>

                               </View>
              </Card.Content>
            </Card>
      </ScrollView>
    );
  }
}
const styles = StyleSheet.create({
  image:{
    alignSelf:'center',
    backgroundColor:'#fff'
  }
});
export default About;
