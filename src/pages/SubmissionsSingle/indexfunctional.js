

import React, { useContext, useEffect, useState } from 'react';
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

Submissions = (props, navigation, route) => {
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
  const isFocused = useIsFocused();

  const {
    navigation,
    tryUpdateCurrentForm,
    setCurrentFormData,
    updateFirebaseSubmissionId,
    fetchSubmissionDataFromCloud,
  } = props;


  useEffect(async () => {
    if (isFocused) {
      console.log(form2);
      setFormId(form2);
      await this.getData();
      setLoading(false);
    }
  }, [isFocused]);

  getData = async () => {
    console.log('frm getdata' + form2);
    setSubmissions([]);
    var tempSubmission = [];
    await firestore()
      .collection('forms')
      .where('slug', '==', form2)
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
                  setSubmissions(submissions => [...submissions, submission]);
                }
              });
            });
        });
      });
    //setSubmissions(tempSubmission)
  }
  onRefresh = () => {
    setIsFetching(true);
    getData();
  }
  makeSubmissionActionButton = (data) => {
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
  deleteSubmission = (formId, submissionId) => {
    deleteFromFirebase(formId, submissionId)
  }
  _renderItem = ({ item }) => {
    if (item.form) {
      const timestamp =
        item.timestamp && item.timestamp.seconds
          ? moment(item.timestamp.seconds * 1000).format('L[:]LTS')
          : 'Unknown';
      if (item.status == filterType) {
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
                        setCurrentSelectedFormId(item.formId);
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
                        setCurrentSelectedFormId(item.formId);
                      }}
                    />
                  </View>
                  {makeSubmissionActionButton(item)}
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
        )
      }
    }

  }

  if (submissions.length == 0 && value == '') {
    return (
      <View style={globalStyles.loaderScreenCentered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  return (
    <View style={[styles.container, { backgroundColor: '#F4F4F4' }]}>
      <FlatList
        data={submissions}
        renderItem={_renderItem}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={getData}
          />
        }
        initialNumToRender={5}
        keyExtractor={item => item.id}
        //getItemLayout={getItemLayout}
        extraData={form2}
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
