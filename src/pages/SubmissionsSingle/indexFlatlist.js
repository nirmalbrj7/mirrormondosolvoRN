import React,{PureComponent} from 'react';
import { View, ToastAndroid, ActivityIndicator, FlatList, Text, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import moment from 'moment';
import { Card, Button } from 'react-native-elements';
import Icons from 'react-native-vector-icons/AntDesign';
import IconsFontisto from 'react-native-vector-icons/Fontisto';
import IconsFeather from 'react-native-vector-icons/Feather';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import globalStyles from '../../globalStyles';
import StoreActionsForm from '../../store/actions/form';
import StoreActionsSubmission from '../../store/actions/submission';
import { Chip } from 'react-native-paper';
import { IconButton, Colors } from 'react-native-paper';
import SingleSubmissionContext from '../../store/context/singlesubmission'
import { useIsFocused } from "@react-navigation/native";
class Submissions extends PureComponent {
  static contextType = SingleSubmissionContext;
  constructor(props, navigation, route) {

    super(props);

    this.state = {
      submissions: [],
      filterType: props.route.name,
      isFetching: false,
      ArrayData: [],
      currentSelected: null,
      currentSelectedFormId: null,
      forms: [{ label: 'All Form', value: 'all' }],
      dateSorting: false,
      formSorting: false,
      currentDateType: true,//for descending
      currentFormType: null,//true for descending false for assending
      currentFormName: 'all',
      value: '',
      formId:null
    };
    this.arrayholder = [];
  }
 
   componentDidMount=async ()=> {
    this._unsubscribe = await this.props.navigation.addListener('focus', async () => {
      //alert('focus');
      // Update your state here
     /* this.setState({
        formId:formId
      })*/
     // await this.getData()

     const formId = this.context;
     const currentFormDocumentId = formId;
     this.setState({
       submissions:[]
     });
     await firestore()
       .collection('forms')
       .where('slug', '==', currentFormDocumentId)
       .get()
       .then(querySnapshot => {
         querySnapshot.forEach(async documentSnapshot => {
           var slugId = documentSnapshot.id;
           var formData = documentSnapshot.data();
           const querySnapshot = await firestore().collection('submissions')
             .doc(slugId)
             .collection('submissionData')
             .get()
             .then(querySnapshot => {
               console.log('Total users: ', querySnapshot.size);
               querySnapshot.forEach(async documentSnapshot => {
                 var submission = documentSnapshot.data();
                 if (slugId == submission.formId) {
                   submission["formName"] = formData.name;
                   submission["form"] = formData;
                   submission["slug"] = slugId;
                   submission["submissionId"] = documentSnapshot.id;
                   this.setState({
                     submissions: [...this.state.submissions, submission],
                   })
                 }
               });
             });
         });
       });
    });
  }

  componentWillUnmount() {
    this._unsubscribe();
  }
  getData = async () => {
    alert('sss')
    const formId = this.context;
    const currentFormDocumentId = formId;
    this.setState({
      submissions:[]
    });
    await firestore()
      .collection('forms')
      .where('slug', '==', currentFormDocumentId)
      .get()
      .then(querySnapshot => {
        querySnapshot.forEach(async documentSnapshot => {
          var slugId = documentSnapshot.id;
          var formData = documentSnapshot.data();
          const querySnapshot = await firestore().collection('submissions')
            .doc(slugId)
            .collection('submissionData')
            .get()
            .then(querySnapshot => {
              console.log('Total users: ', querySnapshot.size);
              querySnapshot.forEach(async documentSnapshot => {
                var submission = documentSnapshot.data();
                if (slugId == submission.formId) {
                  submission["formName"] = formData.name;
                  submission["form"] = formData;
                  submission["slug"] = slugId;
                  submission["submissionId"] = documentSnapshot.id;
                  this.setState({
                    submissions: [...this.state.submissions, submission],
                  })
                }
              });
            });
        });
      });
  }
  onRefresh() {
    this.setState({ isFetching: true, }, () => { this.getData(); });
  }
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
        title="Continue"
        type="clear"
        onPress={onPressCallback}
        buttonStyle={{ backgroundColor: 'transparent', fontSize: 20, color: 'green' }}
      />

    );
  };
  deleteFromFirebase = (formId, submissionId) => {
    firestore()
      .collection('submissions')
      .doc(formId)
      .collection('submissionData')
      .doc(submissionId)
      .delete()
      .then(() => {
        console.log(' firestore deleted!');
        this.bs.current.snapTo(1);
        this.setState({
          currentSelected: null
        })
        ToastAndroid.showWithGravityAndOffset(
          'Submission has been deleted.You can pull to refresh to see changes',
          ToastAndroid.LONG,
          ToastAndroid.BOTTOM,
          25,
          50
        );
        console.log(' fheree!');
        firestore()
          .collection('media')
          .get()
          .then(querySnapshot => {
            querySnapshot.forEach(async documentSnapshot => {
              var data = documentSnapshot.data();
              console.log('1' + data.submissionId);
              console.log('2' + submissionId);
              if (data.submissionId == submissionId) {
                console.log('3match' + submissionId);
                firestore()
                  .collection('media').doc(documentSnapshot.id).
                  delete()
                  .then(() => {
                    console.log(' media deleted!');
                  });
              }

            });
          });
      });
  }
  deleteSubmission = (formId, submissionId) => {
    this.deleteFromFirebase(formId, submissionId)
  }
  _renderItem = ({ item }) => {
    if (item.form) {
      const timestamp =
        item.timestamp && item.timestamp.seconds
          ? moment(item.timestamp.seconds * 1000).format('L[:]LTS')
          : 'Unknown';
      if (item.status == this.state.filterType) {
        return (
          <TouchableOpacity>
            <Card containerStyle={styles.cardWrapper}>
              <View style={{ flex: 1, flexDirection: 'row' }}>
                <View style={{ flex: 2, flexDirection: 'column' }}>
                  <Text style={styles.formName}>{item.form.name}</Text>
                  <Text style={styles.dateWrapper}><IconsFontisto name="date" size={16} color="#000" /><Text style={styles.date}>{' '}{timestamp}</Text></Text>
                  <View style={styles.statusWrapper}>
                    <Chip icon="tag" style={styles.status}>{item.status}</Chip>
                  </View>
                  {
                    this.state.currentSelected == item.submissionId && (item.status == 'Incomplete' || item.status == 'Ready' || item.status == 'Submitted') 
                      ?
                      <Text style={styles.submission}>Id:{item.submissionId}</Text>
                      :
                      null
                  }
                </View>
                <View style={{ flex: 1, flexDirection: 'column' }}>
                  <View style={styles.iconWrapper}>
                    <IconButton
                      icon="delete"
                      color={Colors.red500}
                      size={20}
                      onPress={() => {
                        this.setState({
                          currentSelected: item.submissionId,
                          currentSelectedFormId: item.formId
                        });
                        this.bs.current.snapTo(0)
                      }}
                    />
                    <IconsFeather
                      name="more-vertical"
                      color='gray'
                      size={20}
                      style={{ marginTop: -50 }}
                      onPress={() => {
                        this.setState({
                          currentSelected: item.submissionId,
                          currentSelectedFormId: item.formId
                        });
                      }}
                    />
                  </View>
                  {this.makeSubmissionActionButton(item)}
                  <View>
                    {
                      this.state.currentSelected == item.submissionId ?
                        <Icons name="checkcircleo" size={20} color="green" style={styles.centerText} />
                        :
                        null
                    }
                  </View>
                </View>
              </View>

            </Card>
          </TouchableOpacity>
        )
      }
    }

  }
  
  render() {
    const { submissions, value } = this.state;

    const formId2 = this.context;
    if (submissions.length == 0 && value == '') {
      return (
        <View style={globalStyles.loaderScreenCentered}>
          <ActivityIndicator size="large" />
        </View>
      );
    }
    return (
      <View style={[styles.container, { backgroundColor: '#F4F4F4' }]}>
     <Text>{this.state.formId}</Text>
        <FlatList
          data={submissions}
          renderItem={this._renderItem}
          refreshControl={
            <RefreshControl
              refreshing={this.state.isFetching}
              onRefresh={this.getData.bind()}
            />
          }
          initialNumToRender={5}
          keyExtractor={item => item.id}
          getItemLayout={this.getItemLayout}
          extraData={this.context}
        />
      </View>
    )
  }
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f2f3',

  },
  cardWrapper: {
    paddingVertical: 10,
    marginBottom: 15, 
    marginHorizontal: 10,
    borderRadius: 6
  },
  dateWrapper:{ 
    color: '#000',
    marginTop: 10 
  },
  date: {
    marginRight: 20
  },
  formName:{ 
    fontWeight: '900', 
    marginTop: 5,
    fontSize: 17,
    fontFamily: 'sans-serif-medium' 
  },
  centerText: {
    textAlign: 'center'
  },
  statusWrapper:{ 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'flex-start' 
  },
  status: {
    marginTop: 20
  },
  submission: {
    color: 'gray'
  },
  iconWrapper: {
    flexDirection: 'row', 
    alignItems: 'flex-end', 
    alignSelf: 'flex-end'
  }
})

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
const mapStateToProps = (state) => {
  currentsinglesubmission = state.singlesubmissionreducer[0];
  currentForm = 'hhhhhhhhhhhhhhs';
  currentFormDocumentId = 'aaaaaaaaaaaaaaaaaa';
  return { currentForm, currentFormDocumentId };
}

const ConnectedSubmissions = connect(
  mapStateToProps,
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








export default function(props) {
  const isFocused = useIsFocused();

  return <ConnectedSubmissions {...props} isFocused={isFocused} />;
}
