import React from 'react';
import { ScrollView, View, Text, ActivityIndicator, StyleSheet,Linking } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import commonStyles from '../../globalStyles';
import { Avatar, Card, Paragraph,Title } from "react-native-paper";
import Icons from 'react-native-vector-icons/FontAwesome';
import styles from './style';

import { AppName, AppVersion, Facebook, Twitter, Youtube } from '../../config/constant';
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
    const { aboutText } = this.state;

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
            <Title style={styles.appName}>{AppName}</Title>
            <Text style={styles.appVersion}>Verison: {AppVersion}</Text>
      </Card.Content>
        </Card>

        <Card style={{ marginTop: 20 }}>
          <Card.Content>
            <Paragraph>
              <Text style={styles.aboutText}>{aboutText}</Text>
            </Paragraph>
          </Card.Content>
        </Card>


        <Card style={{ marginTop: 20, marginBottom: 20 }}>
          <Card.Content>
            <Text style={styles.header}>Our Social Media</Text>
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-around', }}>
              <Icons name="youtube-play" size={30} color="red" onPress={() => { Linking.openURL(Youtube) }} />
              <Icons name="facebook" size={28} color="blue" onPress={() => { Linking.openURL(Facebook) }} />
              <Icons name="twitter" size={30} color="#1da1f2" onPress={() => { Linking.openURL(Twitter) }} />

            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    );
  }
}

export default About;
