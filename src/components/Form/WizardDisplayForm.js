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

class FormWizard extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      getDataFromCurrentPage: null,
      submitted: false,
      saveFlag:false,
      submitFlag:false,
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
    var submission=this.props.submission;
if(withStatus=='FirstTime' && submission.isNew==true){
  const page = wizard.pages[wizard.currentPage].key;
  updateSubmissionDataForPageLocally(page, data);
  updateSubmissionDataForPageOnCloud(UPDATE_DATA_STATUSES.INCOMPLETE);
  this.setState({ submitted: true,saveFlag:false });
  return true;
}
    try {
      data = getDataFromCurrentPage();
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
      this.setState({ submitted: true,submitFlag:false });
    } else {
      console.log("udate to clod"+JSON.stringify(withStatus));
      updateSubmissionDataForPageOnCloud(withStatus);
      this.setState({ submitted: true,saveFlag:false });
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
  handleNextButtonPress2 = () => {

 
     try {
       this.updateDataFromPage("FirstTime");
       //jumpToWizardPage(nextPage);
     } catch (e) {
       if (e.message === UPLOAD_ERROR) {
         Alert.alert('Please wait for the files to be uploaded.');
         return;
       }
       alert(JSON.stringify(e));
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
      this.setState({ submitted: true,saveFlag:true });
      this.updateDataFromPage(UPDATE_DATA_STATUSES.READY);
      this.props.navigation.navigate('Home');
      
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
       
            <Button
            style={{width:0,height:0,opacity:0}}
              containerStyle={{width:0,height:0,opacity:0}}
              title="Next"
              onLayout={()=>{this.handleNextButtonPress2()}}
            />
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
              disabled={this.state.saveFlag==true?true:false}
              loading={this.state.saveFlag==true?true:false}
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
              disabled={this.state.submitFlag==true?true:false}
              loading={this.state.submitFlag==true?true:false}
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
)(FormWizard);


export default ConnectedFormFlowWizard;
