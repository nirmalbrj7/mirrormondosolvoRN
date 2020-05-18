import React from 'react';
import { View, Text } from 'react-native';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import globalStyles from '../../../globalStyles';


import styles from './style';

class FormProgressBar extends React.PureComponent {
  render() {
    const { wizard: { pages, currentPage } } = this.props;

    return (
      <View style={styles.progressBarContainer}>
        {pages.map((page, i) => {
          if (i !== currentPage) {
            return <Text key={page.key} style={globalStyles.text}>{page.title}</Text>;
          }
          return <Text key={page.key} style={[globalStyles.text, { fontWeight: 'bold' }]}>{page.title}</Text>;
        })}
      </View>
    );
  }
}

FormProgressBar.propTypes = {
  wizard: PropTypes.shape({
    pages: PropTypes.arrayOf(PropTypes.shape({
      key: PropTypes.string,
      title: PropTypes.string,
    })).isRequired,
    currentPage: PropTypes.number,
  }).isRequired,
};

const mapStateToProps = state => ({
  wizard: state.wizard,
});

const ConnectedFormProgressBar = connect(
  mapStateToProps,
  null,
)(FormProgressBar);

export default ConnectedFormProgressBar;
