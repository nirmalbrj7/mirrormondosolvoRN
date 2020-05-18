import React from 'react';
import {Text, View, Alert, ActivityIndicator,ScrollView} from 'react-native';

import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import auth from '@react-native-firebase/auth';

import NetInfo from "@react-native-community/netinfo";
import Background from '../../components/simple/Background';
import Logo from '../../components/simple/Logo';
import Header from '../../components/simple/Header';
import Button from '../../components/simple/Button';
import TextInput from '../../components/simple/TextInput';

import globalStyles from '../../globalStyles';
import styles from './style';

import Strings from '../../constants/strings';
import { theme } from '../../core/theme';
export default class SectionChangePassword extends React.PureComponent {
  static navigationOptions = () => ({
    title: 'Change Password',
  });

  state = {
    oldPassword: '',
    newPassword: '',
    newPasswordRepeat: '',
    errorPasswordOld: '',
    errorPassword: '',
    errorPasswordRepeat: '',
    errorMessage: '',
    loading: false,
  };

  handlePasswordChange = () => {
    const {oldPassword, newPassword, newPasswordRepeat} = this.state;
    let errorPasswordOld = '';
    let errorPassword = '';
    let errorPasswordRepeat = '';

    if (!oldPassword) {
      errorPasswordOld = Strings.ERROR_FIELD_REQUIRED;
    }
    if (!newPassword) {
      errorPassword = Strings.ERROR_FIELD_REQUIRED;
    }
    if (!newPasswordRepeat) {
      errorPasswordRepeat = Strings.ERROR_FIELD_REQUIRED;
    }
    if (oldPassword && oldPassword.length < 6) {
      errorPasswordOld = Strings.ERROR_PASSWORD_LENGTH;
    }
    if (newPassword && newPassword.length < 6) {
      errorPassword = Strings.ERROR_PASSWORD_LENGTH;
    }
    if (newPasswordRepeat && newPasswordRepeat.length < 6) {
      errorPasswordRepeat = Strings.ERROR_PASSWORD_LENGTH;
    }
    if (newPassword && newPasswordRepeat && newPasswordRepeat !== newPassword) {
      errorPasswordRepeat = Strings.ERROR_NEW_PASSWORDS_NOT_MATCH;
    }
    this.setState({
      errorPasswordOld,
      errorPassword,
      errorPasswordRepeat,
      errorMessage: '',
    });
    if (!errorPasswordOld && !errorPassword && !errorPasswordRepeat) {
      this.setState({loading: true});
      const {currentUser} = auth();

      const cred = auth.EmailAuthProvider.credential(
        currentUser.email,
        oldPassword,
      );
      currentUser
        .reauthenticateWithCredential(cred)
        .then(() => currentUser.updatePassword(newPassword))
        .then(() => {
          Alert.alert(Strings.INFO_PASSWORD_UPDATE_SUCCESS);
          this.setState({
            oldPassword: '',
            newPassword: '',
            newPasswordRepeat: '',
            errorMessage: '',
            loading: false,
          });
        })
        .catch(({message = Strings.ERROR_DEFAULT}) =>
          this.setState({
            errorMessage: message,
            loading: false,
          }),
        );
    }
  };

  handleInputChange = inputName => text => {
    this.setState({[inputName]: text});
  };

  render() {
    const {
      oldPassword,
      newPassword,
      newPasswordRepeat,
      errorMessage,
      errorPasswordOld,
      errorPassword,
      errorPasswordRepeat,
      loading,
    } = this.state;

    return (
<KeyboardAwareScrollView>

<Text style={globalStyles.text}>Change Password</Text>
        {Boolean(errorMessage) && (
          <Text style={styles.changePasswordErrorMessage}>{errorMessage}</Text>
        )}

        

<TextInput
        label="Old Password"
        returnKeyType="next"
        value={oldPassword}
        onChangeText={this.handleInputChange('oldPassword')}
        error={Boolean(errorPasswordOld)}
        errorText={errorPasswordOld}
        secureTextEntry
        autoCapitalize="none"
      />


 
<TextInput
        label="New Password"
        returnKeyType="next"
        value={newPassword}
        onChangeText={this.handleInputChange('newPassword')}
        error={Boolean(errorPassword)}
        errorText={errorPassword}
        secureTextEntry
        autoCapitalize="none"
      />

   

<TextInput
        label="Repeat New Password"
        returnKeyType="next"
        value={newPasswordRepeat}
        onChangeText={this.handleInputChange('newPasswordRepeat')}
        error={Boolean(errorPasswordRepeat)}
        errorText={errorPasswordRepeat}
        secureTextEntry
        autoCapitalize="none"
      />


       

          {loading ? (
            <ActivityIndicator />
          ) : (
            <Button mode="contained"
            
              onPress={this.handlePasswordChange}
              containerStyle={globalStyles.button}
            >Submit</Button>
          )}

      
</KeyboardAwareScrollView>
       
    );
  }
}
