import React from 'react';
import {createDrawerNavigator} from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/FontAwesome5';
import AntIcon from 'react-native-vector-icons/AntDesign';
import globalStyles from '../globalStyles';
import Dimen from '../constants/dimen';

import Actions from './ActionsStackNavigator';
import Profile from './ProfileStackNavigator';
import About from './AboutStackNavigator';
import DrawerContentComponent from '../components/CustomDrawerContentComponent';
import Submissions from './SumbissionsStackNavigator';
import MenuButton from '../components/headerMain/MenuButton';
import LogoutButton from '../components/headerMain/LogoutButton';

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
          headerTitle: 'Form',
          headerLeft: <MenuButton />,
          headerRight: <LogoutButton />,
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
    </Drawer.Navigator>
  );
}

export default MainDrawerNavigator;