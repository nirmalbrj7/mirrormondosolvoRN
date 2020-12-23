import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import PropTypes from 'prop-types';
import auth from '@react-native-firebase/auth';
import commonStyles from '../../globalStyles';
import StoreActionsUser from '../../store/actions/user';
import { connect } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
class LoadingClass extends React.PureComponent {

  getUser = async () => {
    try {
      const user = await AsyncStorage.getItem('user')
      return user ? JSON.parse(user) : {};
    } catch (e) {
      console.log('Failed to fetch the data from storage');
    }
  }





  async componentDidMount() {
    const { navigation } = this.props;
//alert(JSON.stringify(auth().currentUser));
/*var currentUser=auth().currentUser;
if(currentUser!=null){
  var userData = await this.getUser();
     console.log("userDta"+userData);
        this.props.addUser(userData);
        navigation.navigate('Main');
}
else{
  navigation.navigate('SignIn');
}*/
  auth().onAuthStateChanged(async (user) => {
      if (user) {
        var userData = await this.getUser();
     
        this.props.addUser(userData);
        navigation.navigate('Main');
      }
      else {
        navigation.navigate('SignIn');
      }
    });
  }

  render() {
    return (
      <View style={commonStyles.loaderScreenCentered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
}

LoadingClass.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};


const Loading = connect(

  null,
  {

    addUser: StoreActionsUser.addUser,

  },
)(LoadingClass);

export default Loading;