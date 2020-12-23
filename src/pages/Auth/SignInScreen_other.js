import React, {memo, useState,PropTypes,useContext}from 'react';
import {TouchableOpacity, StyleSheet, Text, View, Alert, Keyboard} from 'react-native';
import NetInfo from "@react-native-community/netinfo";
import Background from '../../components/simple/Background';
import Logo from '../../components/simple/Logo';
import Header from '../../components/simple/Header';
import Button from '../../components/simple/Button';
import TextInput from '../../components/simple/TextInput';
//import {Button,TextInput} from 'react-native-paper';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import {theme} from '../../core/theme';
import {emailValidator, passwordValidator} from '../../core/utils';

import styles2 from './style';
import commonStyles from '../../globalStyles';

//import AsyncStorage from '@react-native-community/async-storage';
//import { AuthContext } from "../../context/authcontext";
const LoginScreen = ({navigation}: Props) => {
  //const { signIn } = React.useContext(AuthContext);
 // const {state,dispatch} = React.useContext(AuthContext);
  const [email, setEmail] = useState({value: '', error: ''});
  const [password, setPassword] = useState({value: '', error: ''});
  const [userFullName, setuserFullName] = useState({value: '', error: ''});

  const _onLoginPressed = async () => {
    Keyboard.dismiss;
    const emailError = emailValidator(email.value);
    const passwordError = passwordValidator(password.value);

    if (emailError || passwordError) {
      setEmail({...email, error: emailError});
      setPassword({...password, error: passwordError});
      return;
    }

    var formData = new FormData();
    formData.append('email', email.value);
    formData.append('password', password.value);

  NetInfo.fetch().then(state => {
    if (state.isConnected==true) {
      fetch('https://buildchange.pythonanywhere.com/api/auth/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.value,
          password: password.value,
        }),
      })
        .then(res => res.json())
        .then(async data => {
          try {
            console.log("@"+JSON.stringify(data));
            if(data.detail){
              alert(data.detail);
            }
            await AsyncStorage.setItem('token', data.access);
            try {
              console.log('login' + JSON.stringify(data));
  
              fetch('https://buildchange.pythonanywhere.com/api/profile/', {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: 'Bearer ' + data.access,
                  // Authorization: 'Bearer ' + data.access,
                },
              })
                .then(res2 => res2.json())
                .then(async data2 => {
                  try {
                   // console.log('profile' + JSON.stringify(data2.full_name));
                    console.log('profile' + JSON.stringify(data2));
                    try {
                      setuserFullName({...userFullName, error: 'sss'});
                     // await AsyncStorage.setItem('userFullname', data2.full_name);
                      //await AsyncStorage.setItem('userId', data2.id.toString());
                      //await AsyncStorage.setItem('userEmail', data2.email);
                      //await AsyncStorage.setItem('userType', data2.user_type);
                      //await AsyncStorage.setItem('userImage', data2.image);
  //alert('ddd');
                     // navigation.navigate('ForgetPasswordScreen');
                     console.log('here');
                     //signIn();
                    // dispatch({type:"signIn"});
                    } catch (e) {
                      console.log('error bhayo', e);
                      Alert(e);
                    }
                  } catch (e) {
                    console.log('error aayo', e);
                  }
                })
                .catch(error => {
                  console.error(error);
                });
            } catch (e) {
              console.log('error bhayo', e);
              Alert(e);
            }
          } catch (e) {
            console.log('error aayo', e);
          }
        })
        .catch(error => {
          console.error(error);
        });
    } else {
      Alert.alert("You are not connected to internet!");
    }
  });

   
  };

  return (

    <Background>
     
      <Logo />

      <Header>Data Collection App .</Header>
      <KeyboardAwareScrollView
        //style={{flex: 1}}
        >

<TextInput
        label="Email"
        returnKeyType="next"
        value={email.value}
        onChangeText={text => setEmail({value: text, error: ''})}
        error={!!email.error}
        errorText={email.error}
        autoCapitalize="none"
        autoCompleteType="email"
        textContentType="emailAddress"
        keyboardType="email-address"
      />

      <TextInput
        label="Password"
        returnKeyType="done"
        value={password.value}
        onChangeText={text => setPassword({value: text, error: ''})}
        error={!!password.error}
        errorText={password.error}
        secureTextEntry
      />


      {
        /**
         * 
         *       <View style={styles.forgotPassword}>
        <TouchableOpacity
          onPress={() => navigation.navigate('ForgetPasswordScreen')}>
          <Text style={styles.label}>Forgot your password?</Text>
        </TouchableOpacity>
      </View>
         */
      }

      <Button mode="contained" 
       
     onPress={_onLoginPressed}
      
      
      >
        Login
      </Button>
{
  /**
   *       <View style={styles.row}>
        <Text style={styles.label}>Don’t have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('RegisterScreen')}>
          <Text style={styles.link}>Sign up</Text>
        </TouchableOpacity>
      </View>
   * 
   */
}
        </KeyboardAwareScrollView>


    </Background>
     
      

   
  );
};

const styles = StyleSheet.create({
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

export default LoginScreen;
