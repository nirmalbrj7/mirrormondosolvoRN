import React from 'react';
import { View, ActivityIndicator, Alert, Text } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
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
    const userEmail = auth().currentUser.email;
    this.state = {
      currentUser,
      isConfirmed: false,
      sentEmail: false,
      documentId: null
    };


   /* await firestore()
      .collection('users')
      // .where('email', '==', userEmail)
      .get()
      .then(querySnapshot => {
        console.log('Total users: ', querySnapshot.size);

        querySnapshot.forEach(documentSnapshot => {
          var data = documentSnapshot.data();
          var email = data.email;

          if (userEmail == email) {
            console.log('email: ', documentSnapshot.id);
            this.setState({
              documentId: documentSnapshot.id
            },
               this.userDataRef = await firestore()
                .collection('users')
                .doc(this.state.documentId)

            )


          }
        });
      });*/

    /*   this.userDataRef = firestore()
       .collection('users')*/
    // .where('email', '==', userEmail)
  }

  async componentDidMount() {

  /*  auth().onAuthStateChanged(user => {
      if (user && user.emailVerified) {
        this.setState({
          isConfirmed: true,
        });
      } else {
        this.checkForVerifiedInterval = setInterval(() => {
          const { currentUser } = auth();
          if (currentUser) {
            currentUser.reload().then(() => {
              if (auth().currentUser.emailVerified) {
                this.setState({
                  isConfirmed: true,
                });
                clearInterval(this.checkForVerifiedInterval);
              }
            });
          } else {
            clearInterval(this.checkForVerifiedInterval);
          }
        }, 3000);
      }
    });
    this.userDataUnsubscribe = await this.userDataRef.onSnapshot(
      this.onCollectionUpdate,
    );*/
  }

  componentWillUnmount() {
   // clearInterval(this.checkForVerifiedInterval);
    //this.userDataUnsubscribe();
  }

  onCollectionUpdate = docSnapshot => {
    console.log("snapshot" + JSON.stringify(docSnapshot.data()));
    const { navigation } = this.props;

    if (!docSnapshot.data()) {
      /* auth()
         .signOut()
         .then(() => navigation.navigate('SignIn'))
         .catch(error => {
           Alert.alert(error.message);
         });*/
    } else {
      this.setState(prevState =>
        Object.assign(prevState.currentUser, docSnapshot.data()),
      );
    }
  };

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
      //||
     // !currentUser.email ||
     // !currentUser.fullName
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
