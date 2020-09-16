import React from 'react';
import { connect } from 'react-redux';
import firestore from '@react-native-firebase/firestore';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import PropTypes from 'prop-types';
import globalStyles from '../../globalStyles';
import StoreActionsForm from '../../store/actions/form';
import StoreActionsSubmission from '../../store/actions/submission';
import GroupedFormsList from '../../components/GroupedFormsList';
import GetLocation from 'react-native-get-location'

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

  getGeolocation = async () => {
    GetLocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 15000,
    })
      .then(location => {
        console.log(location);
        return location;
      })
      .catch(error => {
        const { code, message } = error;
        console.warn(code, message);
      })
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

  handleFormsListItemPress = async (payload, latitude, longitude) => {
    const {
      tryUpdateCurrentForm,
      setCurrentFormData,
      initializeSubmission,
    } = this.props;
    const { form, formEndpoint, datagrid, slug } = payload.doc.data();
    tryUpdateCurrentForm({ form, formEndpoint });
    setCurrentFormData(payload.name, payload.doc.id, datagrid, slug);
    initializeSubmission(null, latitude, longitude);
  };

  render() {
    const { loading } = this.state;

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
          <GroupedFormsList
            handleFormsListItemPress={async (payload) => {
              await GetLocation.getCurrentPosition({
                enableHighAccuracy: true,
                //timeout: 15000,
              })
                .then(async (location) => {
                  if (location.latitude) {
                    await this.handleFormsListItemPress(payload, location.latitude, location.longitude)
                    await this.props.navigation.navigate('FormView');
                  }

                })
                .catch(error => {
                  const { code, message } = error;
                  console.warn(code, message);
                })
            }

            }
          />
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
