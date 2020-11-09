import React from 'react';
import { Text, View, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import auth from '@react-native-firebase/auth';
import PropTypes from 'prop-types';
import Background from '../../components/simple/Background';
import Logo from '../../components/simple/Logo';
import Header from '../../components/simple/Header';
import Button from '../../components/simple/Button';
import TextInput from '../../components/simple/TextInput';
import styles from './style';
import Strings from '../../constants/strings';
import { theme } from '../../core/theme';

import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-community/async-storage';

export default class Login extends React.PureComponent {
  state = {
    email: '',
    password: '',
    errorMessage: '',
    errorEmail: '',
    errorPassword: '',
    loading: false,
    loginData: ''
  };

  
  storeData = async (value) => {
    console.log("storing" + JSON.stringify(value));
    try {
      await AsyncStorage.setItem('user', JSON.stringify(value))
    } catch (e) {
      // saving error
    }
  }

  afterLogin = (email) => {
    const { navigation } = this.props;
    firestore()
      .collection('users')
      .where('email', '==', email)
      .get()
      .then(querySnapshot => {
        querySnapshot.forEach(documentSnapshot => {
          var data = documentSnapshot.data();
          this.storeData(data);
        });
      });
    firestore()
      .collection('settings')
      .get();
  };

  onCollectionUpdate = documentSnapshot => {
    this.setState({
      loginData: documentSnapshot.data(),
    });
  };

  handleLogin = () => {
    const { email, password } = this.state;
    const { navigation } = this.props;
    let errorEmail = '';
    let errorPassword = '';
    if (!email) {
      errorEmail = Strings.ERROR_FIELD_REQUIRED;
    }
    if (!password) {
      errorPassword = Strings.ERROR_FIELD_REQUIRED;
    }
    if (email && !Strings.EMAIL_RE.test(email)) {
      errorEmail = Strings.ERROR_EMAIL;
    }
    if (password && password.length < 6) {
      errorPassword = Strings.ERROR_PASSWORD_LENGTH;
    }
    this.setState({ errorEmail, errorPassword, errorMessage: '' });
    if (!errorEmail && !errorPassword) {
      this.setState({ loading: true });
      auth()
        .signInWithEmailAndPassword(email, password)
        .then(() => this.afterLogin(email))
        .catch(({ message = Strings.ERROR_DEFAULT }) =>
          this.setState({
            errorMessage: message,
            errorEmail: '',
            errorPassword: '',
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
      errorMessage,
      errorEmail,
      errorPassword,
      loading,
    } = this.state;
    const { navigation } = this.props;

    return (
      <Background>
        <Logo />
        <Header>Login Screen</Header>
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
        {loading ? (
          <ActivityIndicator color="purple" />
        ) :
          null
        }

        <Button mode="contained"
          title={loading ? 'Loading' : 'Login'}
          onPress={this.handleLogin}
          style={{ borderRadius: 6 }}
        >
          {loading ? 'Loading' : 'Login'}
        </Button>



      </Background>
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

Login.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};
