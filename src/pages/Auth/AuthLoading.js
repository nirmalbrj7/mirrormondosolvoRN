import React from 'react';
import {View, Text, ActivityIndicator} from 'react-native';
import PropTypes from 'prop-types';
import auth from '@react-native-firebase/auth';
import commonStyles from '../../globalStyles';

export default class Loading extends React.PureComponent {
  componentDidMount() {
    const {navigation} = this.props;

    auth().onAuthStateChanged(user => {
      navigation.navigate(user ? 'Main' : 'SignIn');
    });
  }

  render() {
    return (
      <View style={commonStyles.loaderScreenCentered}>
        <Text>Loading</Text>
        <ActivityIndicator size="large" />
      </View>
    );
  }
}

Loading.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};
