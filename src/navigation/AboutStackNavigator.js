import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

import About from '../pages/About';
import MenuButton from '../components/headerMain/MenuButton';
import LogoutButton from '../components/headerMain/LogoutButton';

const Stack = createStackNavigator();

function AboutStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Root"
        component={About}
        options={({navigation}) => ({
          headerTitle: 'About',
          headerLeft: () => <MenuButton navigation={navigation} />,
          headerRight: () => <LogoutButton navigation={navigation} />,
        })}
      />
    </Stack.Navigator>
  );
}

export default AboutStack;
