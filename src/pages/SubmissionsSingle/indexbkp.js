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
import { Chip, Title } from 'react-native-paper';
import { IconButton, Colors } from 'react-native-paper';

import { Button as PaperButton } from 'react-native-paper';
import SingleSubmissionContext from '../../store/context/singlesubmission'
import { useIsFocused } from "@react-navigation/native";

import Animated from 'react-native-reanimated';
import BottomSheet from 'reanimated-bottom-sheet';
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
  fall = new Animated.Value(1)
  bs = React.createRef();
   componentDidMount=async ()=> {
    this._unsubscribe = await this.props.navigation.addListener('focus', async () => {
      //alert('focus');
      // Update your state here
     /* this.setState({
        formId:formId
      })*/
     // await this.getData()
console.log('here');
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
          console.log('slug'+documentSnapshot.id);
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
          console.log('slug'+documentSnapshot.id);
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
          navigation.navigate('View', { submissionId: data.submissionId, slug: data.slug,status:'Submitted' });
        };
        break;
      case 'Synced':
        onPressCallback = () => {
          navigation.navigate('View', { submissionId: data.submissionId, slug: data.slug,status:'Synced' });
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
    console.log("item"+JSON.stringify(item));

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
                   {
                      item.status=='Incomplete'  || item.status=='Ready'?
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
                    :null
                   }
                      
                    

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
  renderInner = () => (

    <View style={styles2.panel}>


     <Title>Delete:</Title>




      <Text>Do you want to delete this submission having Id
  <Text style={{ fontWeight: 'bold' }}>{" "}{this.state.currentSelected}</Text></Text>
      <Text style={{marginTop:10}}><Text style={{ fontWeight: 'bold',marginTop:10 }}>Disclaimer:</Text>After deleting data its associated media data will also will be deleted</Text>
      
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-around', marginTop: 20
      }}>
        <PaperButton style={{ backgroundColor: 'purple', paddingVertical: 5 }} icon="checkcircleo" mode="contained" onPress={() => console.log('Pressed')}
          onPress={() =>

            this.deleteSubmission(this.state.currentSelectedFormId, this.state.currentSelected)


          }

        >
          Confirm Delete
  </PaperButton>
        <PaperButton style={{ backgroundColor: 'blue', paddingVertical: 5 }} icon="closecircleo" mode="contained" onPress={() => console.log('Pressed')}
          onPress={() => {
            this.bs.current.snapTo(1)
    
            this.setState({
              currentSelected: null
            })
          }}
        >
          Close
  </PaperButton>

      </View>

      
      

    </View>


  )

  renderHeader = () => <View style={styles.header} />
  render() {
    const { submissions, value } = this.state;

    const formId2 = this.context;
    if (submissions.length == 0 ) {
      return (
        <View style={globalStyles.loaderScreenCentered}>
          <ActivityIndicator size="large" color="purple" />
         
        </View>
      );
    }
    return (
      <View style={[styles.container, { backgroundColor: '#F4F4F4' }]}>
 

 
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
          keyExtractor={item => item.submissionId}
          getItemLayout={this.getItemLayout}
          extraData={this.context}
        />
            <BottomSheet
            ref={this.bs}
            snapPoints={[300, 0]}
            renderContent={this.renderInner}
            renderHeader={this.renderHeader}
            initialSnap={1}
            callbackNode={this.fall}
            enabledInnerScrolling={false}
            enabledContentGestureInteraction={false}
          />
          <Animated.View
            style={{
              alignItems: 'center',
              opacity: Animated.add(0.1, Animated.multiply(this.fall, 1)),
            }}
          >
             </Animated.View>
      </View>
    )
  }
}
const IMAGE_SIZE = 200
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
  },

 
});
const styles2=StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f2f3',

  },
  box: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
  },
  panelContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  panel: {
    height: 600,
    padding: 20,
    // backgroundColor: 'red',
    paddingTop: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 5,
    shadowOpacity: 0.6,
    backgroundColor: '#fff'
  },
  header: {
    width: '100%',
    height: 50,
    // backgroundColor:'red'
  },
  panelHeader: {
    alignItems: 'center',
  },
  panelHandle: {
    width: 40,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00000040',
    marginBottom: 10,
  },
  panelTitle: {
    fontSize: 27,
    height: 35,
  },
  panelSubtitle: {
    fontSize: 14,
    color: 'gray',
    height: 30,
    marginBottom: 10,
  },
  panelButton: {
    padding: 15,
    borderRadius: 10,
    // backgroundColor: '#292929',
    alignItems: 'center',
    marginVertical: 10,
    minWidth: 100
  },
  panelButtonTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: 'white',
  },
  photo: {
    width: '100%',
    height: 225,
    marginTop: 30,
  },
  map: {
    height: '100%',
    width: '100%',
  },
});

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
  currentsinglesubmission = 'sssss';
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
