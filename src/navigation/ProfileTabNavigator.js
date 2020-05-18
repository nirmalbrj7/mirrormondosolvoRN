import React from 'react';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';

import SectionGroups from '../components/Profile/SectionGroups';
import SectionChangePassword from '../components/Profile/SectionChangePassword';
import Colors from '../constants/colors';
import EditProfile from '../components/Profile/EditProfile';

const Tab = createMaterialTopTabNavigator();

function ProfileSectionsTabNavigator() {
  return (
    <Tab.Navigator
      tabBarOptions={{
        activeTintColor: Colors.TAB_NAVIGATOR_TINT_ACTIVE_COLOR,
        inactiveTintColor: Colors.TAB_NAVIGATOR_TINT_INACTIVE_COLOR,
        style: {
          backgroundColor: Colors.TAB_NAVIGATOR_BACKGROUND_COLOR,
        },
        indicatorStyle: {
          backgroundColor: Colors.TAB_NAVIGATOR_INDICATOR_COLOR,
        },
      }}>
      <Tab.Screen name="Groups" component={SectionGroups} />
      <Tab.Screen name="EditProfile" component={EditProfile} />
      <Tab.Screen name="ChangePassword" component={SectionChangePassword} />
    </Tab.Navigator>
  );
}

export default ProfileSectionsTabNavigator;
