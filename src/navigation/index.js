import React from 'react';
import {NavigationContainer} from '@react-navigation/native';

import AuthAndMainSectionsNavigator from './AuthAndMainNavigator';

export default function AppContainer() {
  return (
    <NavigationContainer>
      <AuthAndMainSectionsNavigator />
    </NavigationContainer>
  );
}
