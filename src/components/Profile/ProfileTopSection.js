import React from 'react';
import { Text, View } from 'react-native';
import PropTypes from 'prop-types';
import globalStyles from '../../globalStyles';
import styles from './style';
import { Avatar } from 'react-native-paper';
function ProfileTopSection(props) {
  const { name, email } = props;
  return (
    <View style={styles.headSectionContainer}>
      <Avatar.Image
        style={{ backgroundColor: '#fff', marginBottom: 20 }}
        source={require('../../assets/images/user.png')}
        size={80}

      />
      {
        /**
         * 
         *  <Avatar.Icon size={80} icon="user" />
         */
      }
     
      <View style={{ marginHorizontal: 20, marginTop: 20 }}>
        <Text style={[globalStyles.text,{fontWeight:'bold'}]}>{name}</Text>
        <Text style={globalStyles.text}>
          {email}
        </Text>
      </View>
    </View>
  );
}

ProfileTopSection.propTypes = {
  name: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  isConfirmed: PropTypes.bool.isRequired,
  sentEmail: PropTypes.bool.isRequired,
  sendEmailVerification: PropTypes.func.isRequired,
};

export default ProfileTopSection;
