import React from 'react';
import { ActivityIndicator, Text, View, TouchableOpacity, StyleSheet,ScrollView } from 'react-native';

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import PropTypes from 'prop-types';

import NetInfo from "@react-native-community/netinfo";
import Background from '../../components/simple/Background';
import Logo from '../../components/simple/Logo';
import Header from '../../components/simple/Header';
import Button from '../../components/simple/Button';
import TextInput from '../../components/simple/TextInput';

import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import commonStyles from '../../globalStyles';
import styles from './style';

import Strings from '../../constants/strings';
import { theme } from '../../core/theme';

export default class SignUp extends React.PureComponent {
  state = {
    email: '',
    password: '',
    passwordRepeat: '',
    fullName: '',
    phone: '',
    errorEmail: '',
    errorPassword: '',
    errorPasswordRepeat: '',
    errorFullName: '',
    errorMessage: '',
    loading: false,
  };

  handleSignUp = () => {
    const { email, password, passwordRepeat, fullName, phone } = this.state;
    const { navigation } = this.props;
    let errorEmail = '';
    let errorPassword = '';
    let errorPasswordRepeat = '';
    let errorFullName = '';
    if (!email) {
      errorEmail = Strings.ERROR_FIELD_REQUIRED;
    }
    if (!password) {
      errorPassword = Strings.ERROR_FIELD_REQUIRED;
    }
    if (!passwordRepeat) {
      errorPasswordRepeat = Strings.ERROR_FIELD_REQUIRED;
    }
    if (!fullName) {
      errorFullName = Strings.ERROR_FIELD_REQUIRED;
    }
    if (email && !Strings.EMAIL_RE.test(email)) {
      errorEmail = Strings.ERROR_EMAIL;
    }
    if (password && password.length < 6) {
      errorPassword = Strings.ERROR_PASSWORD_LENGTH;
    }
    if (passwordRepeat && passwordRepeat !== password) {
      errorPasswordRepeat = Strings.ERROR_NEW_PASSWORDS_NOT_MATCH;
    }
    this.setState({
      errorEmail,
      errorPassword,
      errorPasswordRepeat,
      errorFullName,
      errorMessage: '',
    });
    if (
      !errorEmail &&
      !errorPassword &&
      !errorPasswordRepeat &&
      !errorFullName
    ) {
      this.setState({ loading: true });
      auth()
        .createUserWithEmailAndPassword(email, password)
        .then(cred => {
          const user = auth().currentUser;
          user.sendEmailVerification();
          firestore()
            .collection('users')
            .doc(cred.user.uid)
            .set({
              fullName,
              phone,
              email,
              role: 0,
              status: 1,
            });
        })
        .then(() => {
          navigation.navigate('Main');
        })
        .catch(({ message = Strings.ERROR_DEFAULT }) =>
          this.setState({
            errorMessage: message,
            loading: false,
          }),
        );
    }
  };

  handleInputChange = inputName => text => {
    this.setState({ [inputName]: text });
  };

  render() {
    const {
      email,
      password,
      passwordRepeat,
      fullName,
      phone,
      errorMessage,
      errorEmail,
      errorPassword,
      errorPasswordRepeat,
      errorFullName,
      loading,
    } = this.state;
    const { navigation } = this.props;

    return (
      <ScrollView>
<Background>

        <Logo />

        <Header>SignUp Screen</Header>
        {Boolean(errorMessage) && (
          <Text style={styles.errorMessageText}>{errorMessage}</Text>
        )}
<TextInput
        label="Email"
        returnKeyType="next"
        value={email}
        onChangeText={this.handleInputChange('email')}
        error={Boolean(errorEmail)}
        errorText={errorEmail}
        autoCapitalize="none"
        autoCompleteType="email"
        textContentType="emailAddress"
        keyboardType="email-address"
      />

<TextInput
        label="Password"
        returnKeyType="done"
        value={password}
        onChangeText={this.handleInputChange('password')}
        error={Boolean(errorPassword)}
        errorText={errorPassword}
        secureTextEntry
        autoCapitalize="none"
      />

<TextInput
        label="Repeat Password*"
        returnKeyType="next"
        value={passwordRepeat}
        onChangeText={this.handleInputChange('passwordRepeat')}
        error={Boolean(errorPasswordRepeat)}
        errorText={errorPasswordRepeat}
        secureTextEntry
        autoCapitalize="none"
      />

<TextInput
        label="Full name*"
        returnKeyType="next"
        value={fullName}
        onChangeText={this.handleInputChange('fullName')}
        error={Boolean(errorFullName)}
        errorText={errorFullName}
     
        autoCapitalize="none"
      /> 
<TextInput
        label="Phone number"
        returnKeyType="done"
        value={phone}
        onChangeText={this.handleInputChange('phone')}

        autoCapitalize="none"
        autoCompleteType="tel"
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
      />


          {loading ? (
            <ActivityIndicator />
          ) : (
              <>
                <Button mode="contained" 
                title={loading ? 'Loading' : 'Sign Up'}
                onPress={this.handleSignUp}
                containerStyle={commonStyles.button}
              >
{loading ? 'Loading' : 'Sign Up'}
              </Button>
          
              <View style={styles2.row}>
        <Text style={styles2.label}>Already have an account?  </Text>
        <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
          <Text style={styles2.link}>Login</Text>
        </TouchableOpacity>
      </View>
         
              </>
            )}

      </Background>

      </ScrollView>
      
    );
  }
}
const styles2 = StyleSheet.create({
  forgotPassword: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    marginTop: 4,
  },
  label: {
    color: theme.colors.secondary,
  },
  link: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
});
SignUp.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};
