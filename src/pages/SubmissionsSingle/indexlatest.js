

import React, { useContext, useEffect, useState } from 'react';
import { View, ToastAndroid, ActivityIndicator, FlatList, VirtualizedList, Text, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
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
import SingleSubmissionContext from '../../store/context/singlesubmission'
import { useIsFocused } from "@react-navigation/native";
import { Button as PaperButton } from 'react-native-paper';
import {OptimizedFlatList} from 'react-native-optimized-flatlist'

import Animated from 'react-native-reanimated';
import BottomSheet from 'reanimated-bottom-sheet';
const Submissions = (props, navigation2, route) => {
  //console.log("props"+JSON.stringify(props));
  //console.log("navigation2"+JSON.stringify(navigation2));
  //onsole.log("route"+JSON.stringify(route));
 
  const [isLoading, setLoading] = useState(true);
  const [data, setData] = useState([]);


  const [submissions, setSubmissions] = useState([]);
  const [filterType, setFilterType] = useState(props.route.name);
  const [isFetching, setIsFetching] = useState(false);
  const [ArrayData, setArrayData] = useState([]);
  const [currentSelected, setCurrentSelected] = useState(null);
  const [currentSelectedFormId, setCurrentSelectedFormId] = useState(null);
  const [value, setValue] = useState('');
  const form2 = useContext(SingleSubmissionContext);
  const [formId, setFormId] = useState(null);
  const [count, setCount] = useState(0);
  const isFocused = useIsFocused();

  const [currentformData, setCurrentformData] = useState(null);

  const {
    navigation,
    tryUpdateCurrentForm,
    setCurrentFormData,
    updateFirebaseSubmissionId,
    fetchSubmissionDataFromCloud,
  } = props;

  const fall = new Animated.Value(1)
  const bs = React.createRef();


  useEffect(() => {
    
    (async () => {
      if (isFocused) {
        console.log(form2);
        setFormId(form2);
        const subscriber = await getData();
        setLoading(false);
      }
    })();
    return (async () => await getData());

  }, [isFocused]);

  const renderInner = () => (
    <View style={styles2.panel}>


      <Title>Delete:</Title>




      <Text>Do you want to delete this submission having Id
  <Text style={{ fontWeight: 'bold' }}>{" "}{currentSelected}</Text></Text>
      <Text style={{ marginTop: 10 }}><Text style={{ fontWeight: 'bold', marginTop: 10 }}>Disclaimer:</Text>After deleting data its associated media data will also will be deleted</Text>

      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-around', marginTop: 20
      }}>
        <PaperButton style={{ backgroundColor: 'purple', paddingVertical: 5 }} icon="checkcircleo" mode="contained" onPress={() => console.log('Pressed')}
          onPress={() =>

            deleteSubmission(currentSelectedFormId, currentSelected)


          }

        >
          Confirm Delete
  </PaperButton>
        <PaperButton style={{ backgroundColor: 'blue', paddingVertical: 5 }} icon="closecircleo" mode="contained" onPress={() => console.log('Pressed')}
          onPress={() => {
            bs.current.snapTo(1)
            setCurrentSelected(null);
          }}
        >
          Close
  </PaperButton>

      </View>




    </View>


  )

  const renderHeader = () => <View style={styles.header} />

  const getData = async () => {
 var routeName=props.route.name;
    setSubmissions([]);
    await firestore()
    .collection('forms')
    .where('slug', '==', form2)
    .get()
    .then(querySnapshot => {
      querySnapshot.forEach(async documentSnapshot => {
        var slugId = documentSnapshot.id;
        console.log("slugid"+slugId);
        var formData = documentSnapshot.data();
        setCurrentformData(formData);

        const querySnapshot = await firestore().collection('submissions')
          .doc(slugId)
          .collection('submissionData')
          .where('status', '==', routeName)
          .get()
          .then(querySnapshot => {
            console.log('Total users: ', querySnapshot.size);
            setCount(querySnapshot.size);
       
            querySnapshot.forEach(async documentSnapshot => {
              var submission = documentSnapshot.data();
              //console.log(slugId +'=='+ submission.formId);
              //if (slugId == submission.formId) {
              //  submission["formName"] = formData.name;
             //   submission["form"] = formData;
               // submission["slug"] = slugId;
                submission["submissionId"] = documentSnapshot.id;
                setSubmissions(submissions => [...submissions, submission]);
              //}
            });
          });
      });
    });



    //setSubmissions(tempSubmission)
  }
  const onRefresh = async () => {
    setIsFetching(true);
    await getData();
  }
  const makeSubmissionActionButton = (data) => {
    const {
      navigation,
      tryUpdateCurrentForm,
      setCurrentFormData,
      updateFirebaseSubmissionId,
      fetchSubmissionDataFromCloud,
    } = props;
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
          console.log('aa'+currentformData.form.formEndpoint);
          navigation.navigate('FormView');
          tryUpdateCurrentForm({
            form: currentformData,
            formEndpoint: currentformData.form.formEndpoint,
          });
          setCurrentFormData(currentformData.form.name, currentformData.formId, currentformData.datagrid, currentformData.slug);
          updateFirebaseSubmissionId(currentformData.submissionId);
          fetchSubmissionDataFromCloud(currentformData.submissionId, currentformData.slug);
        };
        break;
      case 'Submitted':
        onPressCallback = () => {
          navigation.navigate('View', { submissionId: currentformData.submissionId, slug: currentformData.slug });
        };
        break;
      case 'Synced':
        onPressCallback = () => {
          navigation.navigate('View', { submissionId: currentformData.submissionId, slug: currentformData.slug });
        };
        break;
      case 'Ready':
        onPressCallback = () => {
          navigation.navigate('FormView');
          tryUpdateCurrentForm({
            form: currentformData.form.form,
            formEndpoint: currentformData.form.formEndpoint,
          });
          setCurrentFormData(currentformData.form.name, currentformData.formId, currentformData.datagrid, currentformData.slug);
          updateFirebaseSubmissionId(currentformData.submissionId);
          fetchSubmissionDataFromCloud(currentformData.submissionId, currentformData.slug);
        };
        break;
      case 'Submitted':
        onPressCallback = () => { };
        break;
      default:
       null
    }

    return (
      <Button
        title="Continue"
        type="clear"
        onPress={onPressCallback}
        buttonStyle={{ backgroundColor: 'transparent' }}
      />

    );
  };
  const deleteFromFirebase = (formId, submissionId) => {
    firestore()
      .collection('submissions')
      .doc(formId)
      .collection('submissionData')
      .doc(submissionId)
      .delete()
      .then(() => {
        console.log(' firestore deleted!');
        bs.current.snapTo(1);
        setCurrentSelected(null);
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
  const deleteSubmission = (formId, submissionId) => {
    deleteFromFirebase(formId, submissionId)
  }
  const getItem = (data, index) => {
    console.log(JSON.stringify(index));
    const timestamp =
    data[index].timestamp && data[index].timestamp.seconds
      ? moment(data[index].timestamp.seconds * 1000).format('L[:]LTS')
      : 'Unknown';
    return {
      id: Math.random().toString(12).substring(0),
      title: `Item ${index + 1}`,
      formName:data[index].form.name,
      formId:data[index].formId,
      submissionId:data[index].submissionId,
      timestamp:timestamp,
      status:data[index].status,
      data:data[index],
      index:index
    }
  }

  /*const getItemCount = (data) => {
    return count;
  }*/

  const Item = ({formName, formId,submissionId,timestamp,status,data,index }) => {
    //if (status == filterType) {
    return (
    
      <TouchableOpacity>

      <Card containerStyle={styles.cardWrapper}>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <View style={{ flex: 2, flexDirection: 'column' }}>
            <Text style={styles.formName}>{formName}</Text>
            <Text style={styles.dateWrapper}><IconsFontisto name="date" size={16} color="#000" /><Text style={styles.date}>{' '}{timestamp}</Text></Text>
            <View style={styles.statusWrapper}>
              <Chip icon="tag" style={styles.status}>{status}</Chip>
            </View>
            {
              currentSelected == submissionId && (status == 'Incomplete' || status == 'Ready' ||status == 'Submitted')
                ?
                <Text style={styles.submission}>Id:{submissionId}</Text>
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
                  setCurrentSelected(submissionId);
                  setCurrentSelectedFormId(formId);
                  bs.current.snapTo(0)
                }}
              />
              <IconsFeather
                name="more-vertical"
                color='gray'
                size={20}
                style={{ marginTop: -50 }}
                onPress={() => {
                  setCurrentSelected(submissionId);
                  setCurrentSelectedFormId(formId);
                }}
              />
            </View>
            {/*makeSubmissionActionButton(data)*/}
            <View>
              {
                currentSelected == submissionId ?
                  <Icons name="checkcircleo" size={20} color="green" style={styles.centerText} />
                  :
                  null
              }
            </View>
          </View>
        </View>

      </Card>
    </TouchableOpacity>
     
    );
    /*}
    else{
      return null;
    }*/
  }
  const _renderItem = ({ item }) => {
    
    //if (item.form) {
      const timestamp =
        item.timestamp && item.timestamp.seconds
          ? moment(item.timestamp.seconds * 1000).format('L[:]LTS')
          : 'Unknown';
          return( 
        
              <TouchableOpacity>
      
                <Card containerStyle={styles.cardWrapper}>
                  <View style={{ flex: 1, flexDirection: 'row' }}>
                    <View style={{ flex: 2, flexDirection: 'column' }}>
                      <Text style={styles.formName}>{currentformData.name}</Text>
                      <Text style={styles.dateWrapper}><IconsFontisto name="date" size={16} color="#000" /><Text style={styles.date}>{' '}{timestamp}</Text></Text>
                      <View style={styles.statusWrapper}>
                        <Chip icon="tag" style={styles.status}>{item.status}</Chip>
                      </View>
                      {
                        currentSelected == item.submissionId && (item.status == 'Incomplete' || item.status == 'Ready' || item.status == 'Submitted')
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
                            setCurrentSelected(item.submissionId);
                            setCurrentSelectedFormId(currentformData.formId);
                            bs.current.snapTo(0)
                          }}
                        />
                        <IconsFeather
                          name="more-vertical"
                          color='gray'
                          size={20}
                          style={{ marginTop: -50 }}
                          onPress={() => {
                            setCurrentSelected(item.submissionId);
                            setCurrentSelectedFormId(currentformData.formId);
                          }}
                        />
                      </View>
                      {makeSubmissionActionButton(currentformData)}
                      <View>
                        {
                          currentSelected == item.submissionId ?
                            <Icons name="checkcircleo" size={20} color="green" style={styles.centerText} />
                            :
                            null
                        }
                      </View>
                    </View>
                  </View>
      
                </Card>
              </TouchableOpacity>
           );
    //}


  }

  if (submissions.length == 0) {
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
        // renderItem={_renderItem}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
          //  onRefresh={onRefresh}
          />
        }
        initialNumToRender={5}
        keyExtractor={item => item.submissionId}
        //getItemLayout={getItemLayout}
        //extraData={form2}

        renderItem={_renderItem}
      //  getItemCount={getItemCount}
       // getItem={getItem}
      />
      <BottomSheet
        ref={bs}
        snapPoints={[300, 0]}
        renderContent={renderInner}
        renderHeader={renderHeader}
        initialSnap={1}
        callbackNode={fall}
        enabledInnerScrolling={false}
        enabledContentGestureInteraction={false}
      />

    </View>
  );





};

/*const ConnectedSubmissions = connect(
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
)(Submissions);*/

export default connect(
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
  dateWrapper: {
    color: '#000',
    marginTop: 10
  },
  date: {
    marginRight: 20
  },
  formName: {
    fontWeight: '900',
    marginTop: 5,
    fontSize: 17,
    fontFamily: 'sans-serif-medium'
  },
  centerText: {
    textAlign: 'center'
  },
  statusWrapper: {
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
const styles2 = StyleSheet.create({
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