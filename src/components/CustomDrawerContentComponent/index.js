import React from 'react';
import { ScrollView, Text, View, Image } from 'react-native';
import { DrawerItemList } from '@react-navigation/drawer';
import { SafeAreaView } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';
import { StyleSheet, Linking, Alert } from 'react-native';
import { Appbar, Avatar, useTheme, Title, Caption, Button } from 'react-native-paper';
import auth from '@react-native-firebase/auth';
import styles from './style';

class CustomDrawerContentComponent extends React.PureComponent {
  state = {
    appName: '',
  };

  homepageSettingsRef = firestore()
    .collection('settings')
    .doc('homepage');

  async componentDidMount() {
    this.homepageSettingsUnsubscribe = this.homepageSettingsRef.onSnapshot(
      this.onCollectionUpdate,
    );
  }

  componentWillUnmount() {
    this.homepageSettingsUnsubscribe();
  }

  onCollectionUpdate = documentSnapshot => {
    this.setState({
      appName: documentSnapshot.data().appName,
    });
  };
  handleLogout = () => {
    const {navigation} = this.props;
    auth()
      .signOut()
      .then(() => navigation.navigate('SignIn'))
      .catch(error => {
        Alert.alert(error.message);
      });
  };

  render() {
    const { appName } = this.state;

    return (
      <ScrollView>
        <SafeAreaView
          style={styles.container}
          forceInset={{
            top: 'always',
            horizontal: 'never',
          }}>
          <View style={styles2.userInfoSection}>
            <Avatar.Image
              source={require('../../assets/images/logo.png')}
              size={80}
            />
            <Title style={styles.drawerHeader}>Hey,Admin</Title>
            <View
              style={{
                marginHorizontal: 5,
                paddingHorizontal: 5,
                height: 1,
                borderColor: 'black',
              }}></View>
          </View>
          <Button
            mode="contained"
            style={{ marginLeft: 18, marginRight: 18, marginTop: 2 }}
            onPress={this.handleLogout}
          >
            logout
      </Button>

          <View style={{ width: '100%', height: 2, marginBottom: 5, backgroundColor: 'purple ' }}></View>
          <DrawerItemList {...this.props} />
        </SafeAreaView>
      </ScrollView>
    );
  }
}
const styles2 = StyleSheet.create({
  drawerContent: {
    flex: 1,
  },
  userInfoSection: {
    paddingLeft: 20,
    marginTop: 20
  },
  title: {
    marginTop: 20,
    fontWeight: 'bold',
  },
  caption: {
    fontSize: 14,
    lineHeight: 14,
  },
  row: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  paragraph: {
    fontWeight: 'bold',
    marginRight: 3,
  },
  drawerSection: {
    marginTop: 15,
  },
  preference: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
});
export default CustomDrawerContentComponent;
