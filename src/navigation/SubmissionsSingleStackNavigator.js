import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import Submissions from '../pages/SubmissionsSingle';
import SubmissionView from '../pages/SubmissionView';
import MenuButton from '../components/headerMain/MenuButton';
import LogoutButton from '../components/headerMain/LogoutButton';
import FilterButton from '../components/headerMain/FilterButton'
import Ionicons from 'react-native-vector-icons/AntDesign';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CommonActions } from '@react-navigation/native';
import {SingleSubmissionProvider} from '../store/context/singlesubmission'


import {View} from 'react-native';
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
function SubmissionsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Root"
        component={Submissions}
        options={({navigation}) => ({
          headerTitle: 'Submissions',
        //  headerLeft: () => <MenuButton navigation={navigation} />,
          headerRight: () =><LogoutButton navigation={navigation} />,
          headerStyle: {
            elevation: 0,
          },
        })}
      />
      <Stack.Screen
        name="View"
        component={SubmissionView}
        options={{
          headerTitle: 'View submission',
        }}
      />
    </Stack.Navigator>
  );
}


function SubmissionsStackIncomplete(props,navigation,route) {
console.log("99props"+JSON.stringify(props));
console.log("99props2"+JSON.stringify(route));
console.log("99props3"+JSON.stringify(navigation));
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Incomplete"
        component={Submissions}
        options={({navigation}) => ({
          headerTitle: 'Submissions',
          headerLeft: () => <Ionicons name="arrowleft" size={30} style={{marginLeft:10}} onPress={()=>navigation.dispatch(CommonActions.goBack())} />,

          headerStyle: {
            elevation: 0,
          },
        })}
      />
      <Stack.Screen
        name="View"
        component={SubmissionView}
        options={{
          headerTitle: 'View submission',
        }}
      />
    </Stack.Navigator>
  );
}
function SubmissionsStackReady() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Ready"
        component={Submissions}
        options={({navigation}) => ({
          headerTitle: 'My Submissions',
          headerLeft: () => <MenuButton navigation={navigation} />,
          headerRight: () => <LogoutButton navigation={navigation} />,
          headerStyle: {
            elevation: 0,
          },
        })}
      />
      <Stack.Screen
        name="View"
        component={SubmissionView}
        options={{
          headerTitle: 'View submission',
        }}
      />
    </Stack.Navigator>
  );
}
function SubmissionsStackSubmitted() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Submitted"
        component={Submissions}
        options={({navigation}) => ({
          headerTitle: 'My Submissions',
          headerLeft: () => <MenuButton navigation={navigation} />,
          headerRight: () => <LogoutButton navigation={navigation} />,
          headerStyle: {
            elevation: 0,
          },
        })}
      />
      <Stack.Screen
        name="View"
        component={SubmissionView}
        options={{
          headerTitle: 'View submission',
        }}
      />
    </Stack.Navigator>
  );
}
function SubmissionsStackSynced() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Synced"
        component={Submissions}
        options={({navigation}) => ({
          headerTitle: 'My Submissions',
          headerLeft: () => <MenuButton navigation={navigation} />,
          headerRight: () => <LogoutButton navigation={navigation} />,
          headerStyle: {
            elevation: 0,
          },
        })}
      />
      <Stack.Screen
        name="View"
        component={SubmissionView}
        options={{
          headerTitle: 'View submission',
        }}
      />
    </Stack.Navigator>
  );
}
function SubmissionsStackUploading() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Uploading"
        component={Submissions}
        options={({navigation}) => ({
          headerTitle: 'My Submissions',
          headerLeft: () => <MenuButton navigation={navigation} />,
          headerRight: () => <LogoutButton navigation={navigation} />,
          headerStyle: {
            elevation: 0,
          },
        })}
      />
      <Stack.Screen
        name="View"
        component={SubmissionView}
        options={{
          headerTitle: 'View submission',
        }}
      />
    </Stack.Navigator>
  );
}

function SubmissionsTab(props, navigation,route ) {
const formId=props.route.params.id;
console.log("Tab"+formId);
  return (
<SingleSubmissionProvider value={formId}>
<Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused
              ? 'ios-information-circle'
              : 'ios-information-circle-outline';
          } else if (route.name === 'Incompelete') {
            iconName = focused ? 'ellipsis1' : 'ellipsis1';
          }
          else if (route.name === 'Ready') {
            iconName = focused ? 'check' : 'check';
          }
          else if (route.name === 'Submitted') {
            iconName = focused ? 'rocket1' : 'rocket1';
          }
          else if (route.name === 'Synced') {
            iconName = focused ? 'rocket1' : 'rocket1';
          }
          else if (route.name === 'Uploading') {
            iconName = focused ? 'cloud' : 'cloudo';
          }

    

          // You can return any component that you like here!
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
      tabBarOptions={{
        activeTintColor: 'tomato',
        inactiveTintColor: 'gray',
      }}
      >    
        <Tab.Screen name="Incompelete" formId="1111111"  options={{ ssss: 'Home!' }} component={SubmissionsStackIncomplete} />
        <Tab.Screen name="Ready" formId="1111111" component={SubmissionsStackReady} />
        <Tab.Screen name="Submitted" formId="1111111" component={SubmissionsStackSubmitted} />
        <Tab.Screen name="Synced" formId="1111111" component={SubmissionsStackSynced} />
        <Tab.Screen name="Uploading" formId="1111111" component={SubmissionsStackUploading} />
      </Tab.Navigator>


</SingleSubmissionProvider>
     
  );
}

export default SubmissionsTab;
