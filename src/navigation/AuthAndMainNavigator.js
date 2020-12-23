import {createSwitchNavigator} from '@react-navigation/compat';

import SignInScreen from '../pages/Auth/SignInScreen';
import SignUpScreen from '../pages/Auth/SignUpScreen';
import AuthLoading from '../pages/Auth/AuthLoading';
import MainDrawerNavigator from './MainDrawerNavigator';

const AuthAndMainNavigator = createSwitchNavigator(
  {
    Main: MainDrawerNavigator,
    SignIn: SignInScreen,
    SignUp: SignUpScreen,
    Loading: AuthLoading,
  },
  {
    initialRouteName: 'Loading',
  },
);

export default AuthAndMainNavigator;
