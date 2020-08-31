import React from 'react';
import {ScrollView, View, Text, ActivityIndicator,StyleSheet} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import commonStyles from '../../globalStyles';
import {Avatar,Card,Paragraph} from "react-native-paper";

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
            <Text style={{textAlign:'center',fontSize:20,color:'purple',fontWeight:'bold'}}>FormCollector App</Text>
            <Text style={{textAlign:'center'}}>Version:0.0.1</Text>

          </Card.Content>
        </Card>

            <Card>
              <Card.Content>
                <Paragraph>
                <Text style={commonStyles.text}>{aboutText}</Text>
                </Paragraph>
              </Card.Content>
            </Card>
       
      </ScrollView>
    );
  }
}
const styles = StyleSheet.create({
  image:{
    alignSelf:'center'
  }
});
export default About;
