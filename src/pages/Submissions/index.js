import React from 'react';
import { View, ActivityIndicator, ScrollView } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { Table, Row, Cell, TableWrapper } from 'react-native-table-component';
import moment from 'moment';
import { Button } from 'react-native-elements';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import styles from '../../components/Profile/style';
import globalStyles from '../../globalStyles';
import StoreActionsForm from '../../store/actions/form';
import StoreActionsSubmission from '../../store/actions/submission';
class Submissions extends React.PureComponent {
  constructor(props, navigation, route) {
    super(props);
    this.state = {
      submissions: [],
      filterType: props.route.name
    };
  }
  async componentDidMount() {
    const querySnapshot = await firestore()
      .collection('submissions')
      .get();
    querySnapshot.forEach(async (documentSnapshot) => {
      if (documentSnapshot.exists == true) {
        const slug = documentSnapshot.id;
        const querySnapshot = await firestore().collection('submissions')
          .doc(slug)
          .collection('submissionData')
          .get()
          .then(querySnapshot => {
            //console.log('Total users: ', querySnapshot.size);
            this.onCollectionUpdate(querySnapshot);
          });
      }
    });
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
      .then(doc => doc.docs.map(item => ({ ...item.data(), id: item.id })));
    docs.forEach(submission => {
      if (submission.formId) {
        forms.map((val,index)=>{
            if(val.id===submission.formId){
              submission["form"]=val;
              submission["slug"]=val.slug
            }
        })
        
        this.setState({
          submissions: [...this.state.submissions, submission]
        })
      }
    });
  };

  makeArrayForTable = (submissions) =>
    submissions
      ? submissions.reduce((acc, item) => {
        if (item.form) {
          const timestamp =
            item.timestamp && item.timestamp.seconds
              ? moment(item.timestamp.seconds * 1000).format('L[\n]LTS')
              : 'Unknown';
          if (item.status == this.state.filterType) {
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
      case 'Synced':
        buttonTitle = 'View';
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
          setCurrentFormData(data.form.name, data.formId, data.datagrid, data.slug);
          updateFirebaseSubmissionId(data.submissionId);
          fetchSubmissionDataFromCloud(data.submissionId, data.slug);
        };
        break;
      case 'Submitted':
        onPressCallback = () => {
          navigation.navigate('View', { submissionId: data.submissionId, slug: data.slug });
        };
        break;
      case 'Synced':
        onPressCallback = () => {
          navigation.navigate('View', { submissionId: data.submissionId, slug: data.slug });
        };
        break;
      case 'Ready':
        onPressCallback = () => {
          navigation.navigate('FormView');
          tryUpdateCurrentForm({
            form: data.form.form,
            formEndpoint: data.form.formEndpoint,
          });
          setCurrentFormData(data.form.name, data.formId, data.datagrid, data.slug);
          updateFirebaseSubmissionId(data.submissionId);
          fetchSubmissionDataFromCloud(data.submissionId, data.slug);
        };
        break;
      case 'Submitted':
        onPressCallback = () => { };
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
    const { submissions } = this.state;

    if (submissions.length == 0) {
      return (
        <View style={globalStyles.loaderScreenCentered}>
          <ActivityIndicator size="large" />
        </View>
      );
    }

    const tableHead = ['Timestamp', 'Form Name', 'Status', 'Actions'];
    const tableData = this.makeArrayForTable(submissions);
      return (
      <ScrollView style={[globalStyles.screenContainer, { paddingVertical: 0 }]}>

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
    )
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

