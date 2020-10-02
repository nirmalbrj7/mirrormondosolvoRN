import React from 'react';
import {Button} from 'react-native-elements';
import PropTypes from 'prop-types';
import styles from '../style';
export default class FilterButton extends React.PureComponent {
  render() {
    const {navigation} = this.props;
    return (
      <Button
        icon={{
          name: 'menu',
          style: {marginRight: 0},
        }}
        buttonStyle={{
          backgroundColor:'#fff'
        }}
        containerStyle={styles.buttonContainerNoPadding}
        iconContainerStyle={styles.buttonContainerNoPadding}
        onPress={() => {
   
        }}
        type="clear"
      />
    );
  }
}

FilterButton.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }),
};
