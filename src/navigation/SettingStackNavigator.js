import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

import Settings from '../pages/Setting';
import MenuButton from '../components/headerMain/MenuButton';
//import LogoutButton from '../components/headerMain/LogoutButton';

const Stack = createStackNavigator();

function SettingStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Root"
        component={Settings}
        options={({navigation}) => ({
          headerTitle: 'Settings',
          headerLeft: () => <MenuButton navigation={navigation} />,
          //headerRight: () => <LogoutButton navigation={navigation} />,
        })}
      />
    </Stack.Navigator>
  );
}

export default SettingStack;
