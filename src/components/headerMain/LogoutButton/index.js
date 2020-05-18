import React from 'react';
import {Button} from 'react-native-elements';
import auth from '@react-native-firebase/auth';
import PropTypes from 'prop-types';
import Alert from 'react-native';

import styles from '../style';

export default class LogoutButton extends React.PureComponent {
  handleLogout = () => {
    const {navigation} = this.props;
    auth()
      .signOut()
      .then(() => navigation.navigate('SignIn'))
      .catch(error => {
        Alert.alert(error.message);
      });
  };

  render() {
    return (
      <Button
        icon={{
          name: 'sign-out',
          type: 'font-awesome',
          style: {marginRight: 0},
        }}
    
        buttonStyle={{
          backgroundColor:'#fff'
        }}
        containerStyle={styles.buttonContainerNoPadding}
        iconContainerStyle={styles.buttonContainerNoPadding}
        onPress={this.handleLogout}
        type="clear"
      />
    );
  }
}

LogoutButton.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }),
};
