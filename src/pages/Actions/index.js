import React from 'react';
import {connect} from 'react-redux';
import firestore from '@react-native-firebase/firestore';
import {ActivityIndicator, ScrollView, Text, View} from 'react-native';
import PropTypes from 'prop-types';

import globalStyles from '../../globalStyles';
import styles from './style';

import StoreActionsForm from '../../store/actions/form';
import StoreActionsSubmission from '../../store/actions/submission';
import GroupedFormsList from '../../components/GroupedFormsList';

class Actions extends React.PureComponent {
  state = {
    appData: {
      appName: '',
      topText: '',
      bottomText: '',
    },
    loading: true,
  };

  homepageSettingsRef = firestore()
    .collection('settings')
    .doc('homepage');

  async componentDidMount() {
    this.homepageSettingsUnsubscribe = this.homepageSettingsRef.onSnapshot(
      this.onCollectionUpdate,
    );
  }

  componentWillUnmount() {
    this.homepageSettingsUnsubscribe();
  }

  onCollectionUpdate = documentSnapshot => {
    this.setState({
      appData: documentSnapshot.data(),
      loading: false,
    });
  };

  handleFormsListItemPress = payload => {
    const {
      navigation,
      tryUpdateCurrentForm,
      setCurrentFormData,
      initializeSubmission,
    } = this.props;
    navigation.navigate('FormView');
    const {form, formEndpoint} = payload.doc.data();
    tryUpdateCurrentForm({form, formEndpoint});
    setCurrentFormData(payload.name, payload.doc.id);
    initializeSubmission(null);
  };

  render() {
    const {appData, loading} = this.state;

    if (loading) {
      return (
        <View style={globalStyles.loaderScreenCentered}>
          <ActivityIndicator size="large" />
        </View>
      );
    }

    return (
      <ScrollView style={globalStyles.screenContainerScrollView}>
        <View style={globalStyles.screenContainer}>
          {
            /**
             *           <Text style={[globalStyles.header1, styles.textContainer]}>
            {appData.appName}
          </Text>
          <Text style={[globalStyles.text, styles.textContainer]}>
            {appData.topText}
          </Text>
             * 
             */
          }

<GroupedFormsList
            handleFormsListItemPress={this.handleFormsListItemPress}
          />
          {
            /**
             *         <Text style={[globalStyles.text, styles.textContainer]}>
            {appData.bottomText}
          </Text>
             * 
             */
          }
  
        </View>
      </ScrollView>
    );
  }
}

Actions.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
  tryUpdateCurrentForm: PropTypes.func.isRequired,
  setCurrentFormData: PropTypes.func.isRequired,
  initializeSubmission: PropTypes.func.isRequired,
};

const ConnectedActions = connect(
  null,
  {
    setCurrentFormData: StoreActionsForm.setCurrentFormData,
    tryUpdateCurrentForm: StoreActionsForm.tryUpdateCurrentForm,
    initializeSubmission: StoreActionsSubmission.initializeSubmission,
  },
)(Actions);

export default ConnectedActions;
