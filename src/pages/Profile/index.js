import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import auth from '@react-native-firebase/auth';
import PropTypes from 'prop-types';
import styles from './style';
import globalStyles from '../../globalStyles';
import ProfileTopSection from '../../components/Profile/ProfileTopSection';
import ProfileSectionsTabNavigator from '../../navigation/ProfileTabNavigator';

class Profile extends React.PureComponent {
  constructor(props) {
    super(props);

    const currentUser = {};
    currentUser.defaultData = auth().currentUser;
    console.log('Auth'+JSON.stringify(auth()));
    const userEmail = auth().currentUser.email;
    this.state = {
      currentUser,
      isConfirmed: false,
      sentEmail: false,
      documentId: null
    };
  }


  sendEmailVerification = () => {
    const user = auth().currentUser;
    user.sendEmailVerification();
    this.setState({
      sentEmail: true,
    });
    setTimeout(() => {
      this.setState({
        sentEmail: false,
      });
    }, 60000);
  };

  render() {
    const { currentUser, isConfirmed, sentEmail } = this.state;
    const { navigation } = this.props;

    if (
      !currentUser ||
      !currentUser.defaultData 
    ) {
      return (
        <View style={globalStyles.loaderScreenCentered}>       
          <ActivityIndicator size="large" />
        </View>
      );
    }

    return (
      <View style={globalStyles.screenContainer}>
        <View style={styles.headSectionContainer}>
          <ProfileTopSection
            name={currentUser.defaultData.displayName}
            email={currentUser.defaultData.email}
            isConfirmed={isConfirmed}
            sentEmail={sentEmail}
            sendEmailVerification={this.sendEmailVerification}
          />
        </View>
        <ProfileSectionsTabNavigator navigation={navigation} />
      </View>
    );
  }
}

Profile.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

Profile.router = ProfileSectionsTabNavigator.router;

Profile.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

export default Profile;
