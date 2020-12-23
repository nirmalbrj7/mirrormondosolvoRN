import React from 'react';
import { ScrollView, View,Text } from 'react-native';
import { DrawerItemList,DrawerItem } from '@react-navigation/drawer';
import { SafeAreaView } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';
import { StyleSheet, Alert } from 'react-native';
import { Avatar, Title, Button } from 'react-native-paper';
import auth from '@react-native-firebase/auth';
import styles from './style';
import AntIcon from 'react-native-vector-icons/AntDesign';
import Dimen from '../../constants/dimen';

import {AppVersion} from "../../config/constant";
class CustomDrawerContentComponent extends React.PureComponent {
  state = {
    appName: '',
    userName: '',
    userEmail:'',
  };

  homepageSettingsRef = firestore()
    .collection('settings')
    .doc('homepage');

  async componentDidMount() {
    const user = auth().currentUser;
    this.setState({
      userName: user.displayName,
      userEmail:user.email
    });
    this.homepageSettingsUnsubscribe = this.homepageSettingsRef.onSnapshot(
      this.onCollectionUpdate,
    );
    
  }

  componentWillUnmount() {
    this.homepageSettingsUnsubscribe();
  }

  onCollectionUpdate = documentSnapshot => {
    /*this.setState({
      appName: documentSnapshot.data().appName,
    });*/
  };
  handleLogout = () => {
    const { navigation } = this.props;
    auth()
      .signOut()
      .then(() => navigation.navigate('SignIn'))
      .catch(error => {
        Alert.alert(error.message);
      });
  };

  render() {
    const { appName, userName,userEmail } = this.state;
    const { state, ...rest } = this.props;
    const newState = { ...state}  //copy from state before applying any filter. do not change original state
    newState.routes = newState.routes.filter(item => item.name !== 'SubmissionsSingle') //replace "Login' with your route name

    return (
      <ScrollView>
        <SafeAreaView
          style={styles.container}
          forceInset={{
            top: 'always',
            horizontal: 'never',
          }}>
          <View style={styles2.userInfoSection}>
            <View>

              <Avatar.Image
                style={{ backgroundColor: '#fff',marginBottom:20 }}
                source={require('../../assets/images/user.png')}
                size={80}

              />
              <Text style={styles.drawerHeader}>{userName}</Text>
              <Text style={styles.drawerHeaderSubText}>{userEmail}</Text>
            </View>

            <View
              style={{
                marginHorizontal: 5,
                paddingHorizontal: 5,
                height: 1,
                borderColor: 'black',
              }}></View>
          </View>
          {
            /*    <Button
            mode="contained"
            style={{ marginLeft: 18, marginRight: 18, marginTop: 2 }}
            onPress={this.handleLogout}
          >
            logout
        </Button>
        */
          }
      
<View style={{backgroundColor:'gray',height:1,width:'90%',alignSelf:'center',marginTop:25,marginBottom:10}}></View>

         
         <DrawerItemList state={newState} {...rest} />

          <DrawerItem
              icon={({ color, size }) =>  <AntIcon
              name="sync"
              color={"#000"}
              size={Dimen.DRAWER_ICONS_SIZE}
            />}
              label='Logout'
              labelStyle={{color:'#000',fontSize:15}}
             /* focused={getActiveRouteState(
                props.state.routes,
                props.state.index,
                'Home'
              )}*/
              onPress={() => {
                this.handleLogout()
              }}
            />

            <Text style={{textAlign:'center',paddingTop:10,marginTop:20}}>Version:{AppVersion}</Text>
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
    paddingLeft: 30,
    marginTop: 25
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
