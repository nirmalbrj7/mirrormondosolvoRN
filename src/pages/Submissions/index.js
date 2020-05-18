import React from 'react';
import {View, ActivityIndicator, Alert, ScrollView} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {Table, Row, Cell, TableWrapper} from 'react-native-table-component';
import moment from 'moment';
import {Button} from 'react-native-elements';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import styles from '../../components/Profile/style';
import globalStyles from '../../globalStyles';

import MenuButton from '../../components/headerMain/MenuButton';
import LogoutButton from '../../components/headerMain/LogoutButton';
import StoreActionsForm from '../../store/actions/form';
import StoreActionsSubmission from '../../store/actions/submission';

class Submissions extends React.PureComponent {
  static navigationOptions = ({navigation}) => ({
    headerTitle: 'My Submissions',
    headerLeft: <MenuButton navigation={navigation} />,
    headerRight: <LogoutButton navigation={navigation} />,
  });

  constructor(props,navigation,route) {
    super(props);
    console.log("NAVIGATION"+JSON.stringify(props.route.name));
  
    this.state = {
      submissions: null,
      filterType:props.route.name
    };

    const currentUid = auth().currentUser.uid;
    this.submissionsListRef = firestore()
      .collection('submissions')
      .where('userId', '==', currentUid)
      .orderBy('timestamp', 'desc');
  }

  async componentDidMount() {
    this.submissionsListUnsubscribe = this.submissionsListRef.onSnapshot(
      this.onCollectionUpdate,
    );
  }

  componentWillUnmount() {
    this.submissionsListUnsubscribe();
  }

  onCollectionUpdate = async querySnapshot => {
    const docs = querySnapshot.docs.map(submissionDoc => {
      const data = submissionDoc.data();
      data.submissionId = submissionDoc.id;
      return data;
    });
    const forms = await firestore()
      .collection('forms')
      .get()
      .then(doc => doc.docs.map(item => ({...item.data(), id: item.id})));
    docs.forEach(submission => {
      if (submission.formId) {
        submission.form = forms.find(item => item.id === submission.formId);
      }
    });
    this.setState({submissions: docs});
  };

  makeArrayForTable = (submissions) =>
    submissions
      ? submissions.reduce((acc, item) => {
          if (item.form) {
            const timestamp =
              item.timestamp && item.timestamp.seconds
                ? moment(item.timestamp.seconds * 1000).format('L[\n]LTS')
                : 'Unknown';
console.log("FILTER TYPE"+item.status);
                if(item.status==this.state.filterType){
                  acc.push([timestamp, item.form.name, item.status, item]);
                }
            
          }
          return acc;
        }, [])
      : null;

  makeSubmissionActionButton = data => {
    const {
      navigation,
      tryUpdateCurrentForm,
      setCurrentFormData,
      updateFirebaseSubmissionId,
      fetchSubmissionDataFromCloud,
      directSubmitDataFromCloudToFormio,
    } = this.props;

    let buttonTitle;
    switch (data.status) {

    
      case 'Incomplete':
        buttonTitle = 'Continue';
        break;
      case 'Submitted':
        buttonTitle = 'View';
        break;
      case 'Ready':
        buttonTitle = 'Submit';
        break;
      case 'Uploading':
        buttonTitle = 'Uploading...';
        break;
      default:
        buttonTitle = 'No action';
    }

    let onPressCallback;
    let isButtonActive = true;
    switch (data.status) {
      case 'Incomplete':
        onPressCallback = () => {
          navigation.navigate('FormView');
          tryUpdateCurrentForm({
            form: data.form.form,
            formEndpoint: data.form.formEndpoint,
          });
          setCurrentFormData(data.form.name, data.formId);
          updateFirebaseSubmissionId(data.submissionId);
          fetchSubmissionDataFromCloud(data.submissionId);
        };
        break;
      case 'Submitted':
        onPressCallback = () => {
          navigation.navigate('View', {submissionId: data.submissionId});
        };
        break;
      case 'Ready':
     /*   onPressCallback = () => {
          navigation.navigate('FormView');
          tryUpdateCurrentForm({
            form: data.form.form,
            formEndpoint: data.form.formEndpoint,
          });
          setCurrentFormData(data.form.name, data.formId);
          updateFirebaseSubmissionId(data.submissionId);
          fetchSubmissionDataFromCloud(data.submissionId);
        };*/
        
        onPressCallback = () => {
          setCurrentFormData(data.form.name, data.formId);
          updateFirebaseSubmissionId(data.submissionId);
          directSubmitDataFromCloudToFormio(
            data.submissionId,
            data.form.formEndpoint,
          );
        };
        break;
      case 'Submitted':
        onPressCallback = () => {};
        break;
      default:
        isButtonActive = false;
    }

    return (
      <Button
        title={buttonTitle}
        onPress={onPressCallback}
        disabled={!isButtonActive}
        titleStyle={styles.tableText}
        buttonStyle={styles.inTableButton}
      />
    );
  };

  render() {
    const {submissions} = this.state;

    if (!submissions) {
      return (
        <View style={globalStyles.loaderScreenCentered}>
          <ActivityIndicator size="large" />
        </View>
      );
    }

    const tableHead = ['Timestamp', 'Form Name', 'Status', 'Actions'];
    const tableData = this.makeArrayForTable(submissions);

    return (
      <ScrollView style={[globalStyles.screenContainer, {paddingVertical: 0}]}>
        <View style={globalStyles.scrollableTableContainer}>
          {tableData ? (
            <Table borderStyle={styles.tableBorder}>
              <Row
                data={tableHead}
                style={styles.tableHead}
                textStyle={styles.tableText}
              />
              {tableData.map((rowData, index) => (
                <TableWrapper key={index} style={styles.tableRow}>
                  {rowData.map((cellData, cellIndex) => 
                  
                  (<Cell
                    textStyle={styles.tableText}
                    key={cellIndex}
                    data={
                      cellIndex === 3
                      ? this.makeSubmissionActionButton(cellData)
                      : cellData
                    }
                    />)
 


                  )}
                </TableWrapper>
              ))}
            </Table>
          ) : null}
        </View>
      </ScrollView>
    );
  }
}

Submissions.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
  tryUpdateCurrentForm: PropTypes.func.isRequired,
  setCurrentFormData: PropTypes.func.isRequired,
  updateFirebaseSubmissionId: PropTypes.func.isRequired,
  fetchSubmissionDataFromCloud: PropTypes.func.isRequired,
  directSubmitDataFromCloudToFormio: PropTypes.func.isRequired,
};

const ConnectedSubmissions = connect(
  null,
  {
    setCurrentFormData: StoreActionsForm.setCurrentFormData,
    tryUpdateCurrentForm: StoreActionsForm.tryUpdateCurrentForm,
    initializeSubmission: StoreActionsSubmission.initializeSubmission,
    updateFirebaseSubmissionId:
      StoreActionsSubmission.updateFirebaseSubmissionId,
    fetchSubmissionDataFromCloud:
      StoreActionsSubmission.fetchSubmissionDataFromCloud,
    directSubmitDataFromCloudToFormio:
      StoreActionsSubmission.directSubmitDataFromCloudToFormio,
  },
)(Submissions);

export default ConnectedSubmissions;
