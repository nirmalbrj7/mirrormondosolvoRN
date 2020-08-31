import React from 'react';
import { ActivityIndicator, Text } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Button from '../../components/simple/Button';
import TextInput from '../../components/simple/TextInput';
import Strings from '../../constants/strings';
import globalStyles from '../../globalStyles';
import styles from './style';
export default class SectionEditProfile extends React.PureComponent {
  static navigationOptions = () => ({
    title: 'Edit Profile',
  });
  state = {
    email: '',
    fullName: '',
    password: '',
    errorEmail: '',
    errorFullName: '',
    errorPassword: '',
    errorMessage: '',
    successMessage: '',
    loading: false,
  };

  componentDidMount() {
    const { navigation } = this.props;

    this.fetchCurrentEmailAndFullName();
    this._unsubscribe = navigation.addListener('blur', () => {
      this.setState({ successMessage: '' });
    });
  }

  componentWillUnmount() {
    this._unsubscribe();
  }

  fetchCurrentEmailAndFullName = () => {
    const { currentUser } = auth();

    const currentEmail = currentUser.email;
    let currentFullName;
    firestore()
      .collection('users')
      .doc(currentUser.uid)
      .get()
      .then(documentSnapshot => {
        const { fullName } = documentSnapshot.data();
        currentFullName = fullName;
      })
      .catch(err => alert(err.message))
      .then(() => {
        this.setState({
          email: currentEmail,
          fullName: currentFullName,
        });
      });
  };

  handleSave = () => {
    const { email, fullName, password } = this.state;

    let errorEmail = '';
    let errorFullName = '';
    let errorPassword = '';

    if (!email) {
      errorEmail = Strings.ERROR_FIELD_REQUIRED;
    }
    if (!fullName) {
      errorFullName = Strings.ERROR_FIELD_REQUIRED;
    }
    if (email && !Strings.EMAIL_RE.test(email)) {
      errorEmail = Strings.ERROR_EMAIL;
    }
    if (!password) {
      errorPassword = Strings.ERROR_FIELD_REQUIRED;
    }
    if (password && password.length < 6) {
      errorPassword = Strings.ERROR_PASSWORD_LENGTH;
    }

    this.setState({
      errorEmail,
      errorFullName,
      errorPassword,
      errorMessage: '',
      successMessage: '',
    });
    if (!errorEmail && !errorFullName && !errorPassword) {
      this.setState({ loading: true });

      const { currentUser } = auth();

      const promSetAuth = () => {
        const cred = auth.EmailAuthProvider.credential(
          currentUser.email,
          password,
        );

        return currentUser
          .reauthenticateWithCredential(cred)
          .then(() => currentUser.updateEmail(email));
      };

      const promSetFirestore = firestore()
        .collection('users')
        .doc(currentUser.uid)
        .update({
          email,
          fullName,
        });

      Promise.all([promSetAuth(), promSetFirestore])
        .then(() => {
          this.setState({
            successMessage: Strings.SUCCESS_EDIT_EMAIL_FULL_NAME,
            loading: false,
            password: '',
          });
        })
        .catch(({ message = Strings.ERROR_DEFAULT }) =>
          this.setState({
            errorMessage: message,
            loading: false,
            password: '',
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
      fullName,
      password,
      errorPassword,
      errorMessage,
      errorEmail,
      errorFullName,
      successMessage,
      loading,
    } = this.state;

    const { navigation } = this.props;

    return (
   
       <KeyboardAwareScrollView>

       <Text style={globalStyles.text}>Edit email and full name</Text>
        {Boolean(errorMessage) && (
          <Text style={styles.errorMessageText}>{errorMessage}</Text>
        )}
        {Boolean(successMessage) && (
          <Text style={styles.successMessageText}>{successMessage}</Text>
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
          label="Full name*"
          returnKeyType="next"
          value={fullName}
          onChangeText={this.handleInputChange('fullName')}
          error={Boolean(errorFullName)}
          errorText={errorFullName}
          autoCapitalize="none"
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
          <ActivityIndicator />
        ) : (
            <Button mode="contained"
              containerStyle={globalStyles.button}
              onPress={this.handleSave}
            >
              Save
            </Button>
          )}
       </KeyboardAwareScrollView>
    );
  }
}
