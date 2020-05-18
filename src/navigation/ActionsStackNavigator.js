import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import FormView from '../pages/FormView';
import Actions from '../pages/Actions';
import MenuButton from '../components/headerMain/MenuButton';
import LogoutButton from '../components/headerMain/LogoutButton';

const Stack = createStackNavigator();

function ActionsStack() {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen
        name="Home"
        component={Actions}
        options={({navigation}) => ({
          headerTitle: 'Forms',
          headerLeft: () => <MenuButton navigation={navigation} />,
          headerRight: () => <LogoutButton navigation={navigation} />,
        })}
      />
      <Stack.Screen
        name="FormView"
        component={FormView}
        options={{headerTitle: 'Report'}}
        
      />
    </Stack.Navigator>
  );
}

export default ActionsStack;
