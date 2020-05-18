import React from 'react';
import {
  View, ActivityIndicator, Text, Alert,
} from 'react-native';
import { connect } from 'react-redux';
import { Button } from 'react-native-elements';
import PropTypes from 'prop-types';

import styles from './style';
import Strings from '../../constants/strings';

import FormWizardPage from './FormWizardPage';
import FormProgressBar from './FormProgressBar';
import { FETCHABLE_DATA_STATUS, UPDATE_DATA_STATUSES } from '../../constants/values';
import StoreActionsForm from '../../store/actions/form';
import StoreActionsSubmission from '../../store/actions/submission';
import StoreActionsCommon from '../../store/actions/common';

const UPLOAD_ERROR = 'Uploading Error';


class FormWizard extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      getDataFromCurrentPage: null,
      submitted: false,
    };
  }

  componentWillUnmount() {
    const { submitted } = this.state;
    const { status, suspendFormInteractionSession } = this.props;
    suspendFormInteractionSession();
    if (submitted) return;
    if (status === FETCHABLE_DATA_STATUS.SUCCESS) {
      try {
        this.updateDataFromPage(UPDATE_DATA_STATUSES.INCOMPLETE);
      } catch (e) {}
    }
  }

  receiveCallbackForDataRetrieval = (callback) => {
    console.log('CALLBACK'+JSON.stringify(callback));
    this.setState({
      getDataFromCurrentPage: callback,
    });
  };

  updateDataFromPage = (withStatus) => {
    
    const {
      updateSubmissionDataForPageLocally,
      updateSubmissionDataForPageOnCloud,
      submitCurrentDataToFormio,
      wizard,
    } = this.props;
    const { getDataFromCurrentPage } = this.state;

    let data;
    try {
      data = getDataFromCurrentPage();
      console.log("UPDATE"+JSON.string(data));
    } catch (e) {
      if (e.message === 'Validation error') {
        throw e;
      }
    }
    Object.keys(data).forEach((key) => {
      if (typeof data[key] === 'object' && data[key].uploading) {
        throw new Error(UPLOAD_ERROR);
      }
    });
    const page = wizard.pages[wizard.currentPage].key;

    updateSubmissionDataForPageLocally(page, data);

    if (withStatus === UPDATE_DATA_STATUSES.SUBMIT) {
      submitCurrentDataToFormio();
    } else {
     
      updateSubmissionDataForPageOnCloud(withStatus);
    }
  };

  handlePrevButtonPress = () => {
    const { wizard, jumpToWizardPage } = this.props;
    const nextPage = wizard.currentPage - 1;

    try {
      this.updateDataFromPage(UPDATE_DATA_STATUSES.INCOMPLETE);
      jumpToWizardPage(nextPage);
    } catch (e) {
      Alert.alert('Please fix the following errors before submitting.');
    }
  };

  handleNextButtonPress = () => {
    const { wizard, jumpToWizardPage } = this.props;
    const nextPage = wizard.currentPage + 1;

    try {
      this.updateDataFromPage(UPDATE_DATA_STATUSES.INCOMPLETE);
      jumpToWizardPage(nextPage);
    } catch (e) {
      if (e.message === UPLOAD_ERROR) {
        Alert.alert('Please wait for the files to be uploaded.');
        return;
      }
      Alert.alert('Please fix the following errors before submitting.');
    }
  };

  handleSaveButtonPress = () => {
    try {
      this.setState({ submitted: true });
      this.updateDataFromPage(UPDATE_DATA_STATUSES.READY);
    } catch (e) {
      if (e.message === UPLOAD_ERROR) {
        Alert.alert('Please wait for the files to be uploaded.');
        return;
      }
      Alert.alert('Please fix the following errors before submitting.');
    }
  };

  handleSubmitButtonPress = () => {
    try {
      this.setState({ submitted: true });
      this.updateDataFromPage(UPDATE_DATA_STATUSES.SUBMIT);
    } catch (e) {
      if (e.message === UPLOAD_ERROR) {
        Alert.alert('Please wait for the files to be uploaded.');
        return;
      }
      Alert.alert('Please fix the following errors before submitting.');
    }
  };

  render() {
    const { status, wizard, errorMessageText } = this.props;

    if (status === FETCHABLE_DATA_STATUS.LOADING) {
      return <ActivityIndicator size="large" />;
    }
    if (status === FETCHABLE_DATA_STATUS.FAIL) {
      return (
        <View>
          <Text>
            {Strings.ERROR_FORM_LOADING_UNKNOWN}
          </Text>
          <Text>{errorMessageText}</Text>
        </View>
      );
    }
    return (
      <View style={styles.fromFlowWizardContainer}>
        <FormProgressBar />
        <View style={styles.wizardPageContainer}>

          <FormWizardPage
            receiverOfCallbackForDataRetrieval={this.receiveCallbackForDataRetrieval}
          />
              
        </View>
        <View style={styles.buttonBar}>
          {!wizard.isFirstPage && (
            <Button
              containerStyle={styles.previousButton}
              title="Previous"
              onPress={this.handlePrevButtonPress}
            />
          )}
          {wizard.isLastPage && (
            <Button
              containerStyle={styles.saveButton}
              title="Save"
              onPress={this.handleSaveButtonPress}
            />
          )}
          {!wizard.isLastPage ? (
            <Button
              containerStyle={styles.nextButton}
              title="Next"
              onPress={this.handleNextButtonPress}
            />
          ) : (
            <Button
              containerStyle={styles.nextButton}
              title="Submit"
              onPress={this.handleSubmitButtonPress}
            />
          )}
        </View>
      </View>
    );
  }
}

FormWizard.propTypes = {
  jumpToWizardPage: PropTypes.func.isRequired,
  updateSubmissionDataForPageLocally: PropTypes.func.isRequired,
  updateSubmissionDataForPageOnCloud: PropTypes.func.isRequired,
  submitCurrentDataToFormio: PropTypes.func.isRequired,
  suspendFormInteractionSession: PropTypes.func.isRequired,
  wizard: PropTypes.shape({
    currentPage: PropTypes.number.isRequired,
    pages: PropTypes.arrayOf(PropTypes.shape({})),
    isFirstPage: PropTypes.bool.isRequired,
    isLastPage: PropTypes.bool,
  }),
  status: PropTypes.string.isRequired,
  errorMessageText: PropTypes.string,
};

FormWizard.defaultProps = {
  errorMessageText: null,
  wizard: {
    isLastPage: false,
  },
};


const mapStateToProps = state => ({
  status: state.form.formDataStatus,
  errorMessageText: state.form.formDataErrorMessage,
  wizard: state.wizard,
});

const mapDispatchToProps = {
  jumpToWizardPage: StoreActionsForm.jumpToWizardPage,
  updateSubmissionDataForPageLocally: StoreActionsSubmission.updateSubmissionDataForPageLocally,
  updateSubmissionDataForPageOnCloud: StoreActionsSubmission.updateSubmissionDataForPageOnCloud,
  submitCurrentDataToFormio: StoreActionsSubmission.submitCurrentDataToFormio,
  suspendFormInteractionSession: StoreActionsCommon.suspendFormInteractionSession,
};

const ConnectedFormFlowWizard = connect(
  mapStateToProps,
  mapDispatchToProps,
)(FormWizard);


export default ConnectedFormFlowWizard;
