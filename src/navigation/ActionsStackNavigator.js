import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import FormView from '../pages/FormView';
import FormViewForm from '../pages/FormViewForm';
import Actions from '../pages/Actions';
import MenuButton from '../components/headerMain/MenuButton';
import LogoutButton from '../components/headerMain/LogoutButton';
import SyncButton from '../components/headerMain/SyncButton';
import { View } from 'react-native';
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
          headerRight: () => <View style={{flex:1,flexDirection:'row'}}>
            <SyncButton navigation={navigation} />
          
          <LogoutButton navigation={navigation} />
          </View>
          ,
        })}
      />
      <Stack.Screen
        name="FormView"
        component={FormView}
        options={{headerTitle: 'Report'}}
        
      />
            <Stack.Screen
        name="FormViewForm"
        component={FormViewForm}
        options={{headerTitle: 'Report'}}
        
      />
    </Stack.Navigator>
  );
}

export default ActionsStack;
