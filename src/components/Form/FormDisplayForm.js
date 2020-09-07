import React from 'react';
import {View, ActivityIndicator, Text, Alert} from 'react-native';
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
class FormDisplayForm extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      getDataFromCurrentPage: null,
      submitted: false,
      saveFlag:false,
      submitFlag:false
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
  componentDidMount(){
    const { status } = this.props;
    if (status === "SUCCESS") {
      try {
        this.updateDataFromPage(UPDATE_DATA_STATUSES.INCOMPLETE);
      } catch (e) {
        console.log("error"+e);
      }
    }
  }

  receiveCallbackForDataRetrieval = (callback) => {
    console.log("here");
    this.setState({
      getDataFromCurrentPage: callback,
    });
  };

  updateDataFromPage = (withStatus) => {
    const {
      updateSubmissionDataForPageLocally,
      updateSubmissionDataForPageOnCloud,
      submitCurrentDataToFormio,
    } = this.props;
    const { getDataFromCurrentPage } = this.state;

    let data;
    try {
      data = getDataFromCurrentPage();
      alert("datat"+JSON.stringify(data));
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

    updateSubmissionDataForPageLocally('__root', data);

    if (withStatus === UPDATE_DATA_STATUSES.SUBMIT) {
      submitCurrentDataToFormio();
      this.setState({ submitted: true,submitFlag:false });
    } else {
      updateSubmissionDataForPageOnCloud(withStatus);
      this.setState({ submitted: true,submitFlag:false });
    }
  };

  handleSaveButtonPress = () => {
    try {
      this.setState({ submitted: true,saveFlag:true });
      this.updateDataFromPage(UPDATE_DATA_STATUSES.READY);
    } catch (e) {
      this.setState({ submitted: true,saveFlag:false });
      if (e.message === UPLOAD_ERROR) {
        Alert.alert('Please wait for the files to be uploaded.');
        return;
      }
      Alert.alert('Please fix the following errors before submitting.');
    }
  };

  handleSubmitButtonPress = () => {
    try {
      this.setState({ submitted: true,submitFlag:true });
      this.updateDataFromPage(UPDATE_DATA_STATUSES.SUBMIT);
      this.props.navigation.navigate('Home');
    } catch (e) {
      this.setState({ submitted: true,submitFlag:false });
      if (e.message === UPLOAD_ERROR) {
        Alert.alert('Please wait for the files to be uploaded.');
        return;
      }
     Alert.alert('Please fix the following errors before submitting.');
    }
  };
  handleNextButtonPress2 = () => {
    try {
      this.updateDataFromPage("FirstTime");
    } catch (e) {
      if (e.message === UPLOAD_ERROR) {
        Alert.alert('Please wait for the files to be uploaded.');
        return;
      }
      alert(JSON.stringify(e));
    }
  };
  render() {
    const { status, errorMessageText } = this.props;

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
        <Button
            style={{width:0,height:0,opacity:0}}
              containerStyle={{width:0,height:0,opacity:0}}
              title="Next"
              onLayout={()=>{this.handleNextButtonPress2()}}
            />
                   <FormWizardPage
            receiverOfCallbackForDataRetrieval={this.receiveCallbackForDataRetrieval}
          />
           
        </View>
        <View style={styles.buttonBar}>
          <Button
            containerStyle={styles.saveButton}
            title="Save"
            onPress={this.handleSaveButtonPress}
            disabled={this.state.saveFlag==true?true:false}
            loading={this.state.saveFlag==true?true:false}
          />
          <Button
            containerStyle={styles.nextButton}
            title="Submit"
            onPress={this.handleSubmitButtonPress}
            disabled={this.state.submitFlag==true?true:false}
            loading={this.state.submitFlag==true?true:false}
          />
        </View>
      </View>
    );
  }
}

FormDisplayForm.propTypes = {
  updateSubmissionDataForPageLocally: PropTypes.func.isRequired,
  updateSubmissionDataForPageOnCloud: PropTypes.func.isRequired,
  submitCurrentDataToFormio: PropTypes.func.isRequired,
  suspendFormInteractionSession: PropTypes.func.isRequired,
  status: PropTypes.string.isRequired,
  errorMessageText: PropTypes.string,
};

FormDisplayForm.defaultProps = {
  errorMessageText: null,
};


const mapStateToProps = state => ({
  status: state.form.formDataStatus,
  errorMessageText: state.form.formDataErrorMessage,
  submission:state.submission
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
)(FormDisplayForm);


export default ConnectedFormFlowWizard;
