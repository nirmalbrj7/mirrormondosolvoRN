import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import Profile from '../pages/Profile';
import MenuButton from '../components/headerMain/MenuButton';
import LogoutButton from '../components/headerMain/LogoutButton';

const Stack = createStackNavigator();

function ProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Root"
        component={Profile}
        options={({navigation}) => ({
          headerTitle: 'Profile',
          headerLeft: () => <MenuButton navigation={navigation} />,
          headerRight: () => <LogoutButton navigation={navigation} />,
        })}
      />
    </Stack.Navigator>
  );
}

export default ProfileStack;
