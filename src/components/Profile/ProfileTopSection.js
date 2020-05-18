import React from 'react';
import {Text, View} from 'react-native';
import PropTypes from 'prop-types';
import {Button} from 'react-native-elements';

import globalStyles from '../../globalStyles';
import styles from './style';

function ProfileTopSection(props) {
  const {name, email, isConfirmed, sendEmailVerification, sentEmail} = props;

  return (
    <View style={styles.headSectionContainer}>
      <Text style={globalStyles.text}>{name}</Text>
      <Text style={globalStyles.text}>
        {email}
        {' - '}
        {isConfirmed ? (
          <Text style={globalStyles.successText}>Confirmed</Text>
        ) : (
          <Text style={globalStyles.errorText}>Not confirmed</Text>
        )}
      </Text>
      {!isConfirmed && !sentEmail && (
        <Button
          onPress={sendEmailVerification}
          title="Send Email Verification"
        />
      )}
      {sentEmail && !isConfirmed && (
        <Text style={globalStyles.text}>Check you email.</Text>
      )}
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
