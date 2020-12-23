import React from 'react';
import { Text, View, ActivityIndicator, TouchableOpacity, StyleSheet, Keyboard } from 'react-native';
import {Title} from 'react-native-paper';
import auth from '@react-native-firebase/auth';
import PropTypes from 'prop-types';
import Background from '../../components/simple/Background';
import Logo from '../../components/simple/Logo';
import Header from '../../components/simple/Header';
import Button from '../../components/simple/Button';
import TextInput from '../../components/simple/TextInput';
import styles from './style';
import commonStyles from '../../globalStyles';
import Strings from '../../constants/strings';
import { theme } from '../../core/theme';

import { Button as PaperButton } from 'react-native-paper';

import StoreActionsUser from '../../store/actions/user';
import { connect } from 'react-redux';

import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

class LoginClass extends React.PureComponent {
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
        console.log('Total users: ', querySnapshot.size);

        querySnapshot.forEach(documentSnapshot => {
          console.log('User ID: ', documentSnapshot.id, documentSnapshot.data());

          var data = documentSnapshot.data();
          this.props.addUser(data);
          this.storeData(data);
        });
      });
    firestore()
      .collection('settings')
      .get();

    this.setState({
      loading: false,
    })
   // navigation.navigate('Loading');



  };



  onCollectionUpdate = documentSnapshot => {
    this.setState({
      loginData: documentSnapshot.data(),
    });
  };


  handleLogin = () => {
    Keyboard.dismiss();

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
        .then((e) =>{ 
        console.log("k aau6"+JSON.stringify(e));
       
        console.log("k aau62"+JSON.stringify(e))
        const { navigation } = this.props;
        firestore()
        .collection('users')
        .where('email', '==', email)
        .get()
        .then(querySnapshot => {
          console.log('Total users: ', querySnapshot.size);
  
          querySnapshot.forEach(documentSnapshot => {
            console.log('User ID: ', documentSnapshot.id, documentSnapshot.data());
  
            var data = documentSnapshot.data();
            this.props.addUser(data);
            this.storeData(data);
          });
        });

        firestore()
          .collection('settings')
          .get();
    
        this.setState({
          loading: false,
        })
       
        navigation.navigate('Main');
      
      
      })
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

        <Header>Welcome Back</Header>
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
        ) : null

        }

        <PaperButton
          icon={loading ? 'ellipsis1' : 'login'}
          mode="contained"
          onPress={this.handleLogin}
          disabled={loading ? true : false}
          style={{ width: '100%', paddingVertical: 5, marginTop: 20,borderRadius:6 }}
          labelStyle={{ fontWeight: '900',fontSize:20 }}
          uppercase={false}
        >
          {loading ? 'Loading' : 'Login'}
        </PaperButton>



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

LoginClass.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};
/*function mapStateToProps(state) {
  const { userreducer } = state;
  console.log('user'+JSON.stringify(userreducer))
  return { userDta: userreducer }
}*/

const Login = connect(

  null,
  {

    addUser: StoreActionsUser.addUser,

  },
)(LoginClass);

export default Login;