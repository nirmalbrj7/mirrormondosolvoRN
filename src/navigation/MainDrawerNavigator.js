import React from 'react';
import {createDrawerNavigator} from '@react-navigation/drawer';
import AntIcon from 'react-native-vector-icons/AntDesign';
import globalStyles from '../globalStyles';
import Dimen from '../constants/dimen';
import Actions from './ActionsStackNavigator';
import Profile from './ProfileStackNavigator';
import About from './AboutStackNavigator';
import Logout from './../pages/Logout';
import DrawerContentComponent from '../components/CustomDrawerContentComponent';
import Submissions from './SumbissionsStackNavigator';
import SubmissionsSingle from './SubmissionsSingleStackNavigator';
const Drawer = createDrawerNavigator();

function MainDrawerNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="Actions"
      drawerContent={props => <DrawerContentComponent {...props} />}
      drawerContentOptions={{
        labelStyle: globalStyles.text,
      }}>
      <Drawer.Screen
        name="Forms"
        component={Actions}
        options={{
          headerTitle: 'Forms',
          
       //   headerLeft: <MenuButton />,

          drawerIcon: ({tintColor}) => (
            <AntIcon
              name="form"
              color={tintColor}
              size={Dimen.DRAWER_ICONS_SIZE}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="Profile"
        component={Profile}
        options={{
          drawerIcon: ({tintColor}) => (
            <AntIcon
              name="user"
              color={tintColor}
              size={Dimen.DRAWER_ICONS_SIZE}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="Submissions"
        component={Submissions}
        options={{
          drawerIcon: ({tintColor}) => (
            <AntIcon
              name="rocket1"
              color={tintColor}
              size={Dimen.DRAWER_ICONS_SIZE}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="About"
        component={About}
        options={{
          drawerIcon: ({tintColor}) => (
            <AntIcon
              name="message1"
              color={tintColor}
              size={Dimen.DRAWER_ICONS_SIZE}
            />
          ),
        }}
      />
          <Drawer.Screen
        name="SubmissionsSingle"
        component={SubmissionsSingle}
    
        options={{
          drawerIcon: ({tintColor}) => (
            <AntIcon
              name="message1"
              color={tintColor}
              size={Dimen.DRAWER_ICONS_SIZE}
            />
          ),
        }}
      />
         
    </Drawer.Navigator>
  );
}

export default MainDrawerNavigator;
