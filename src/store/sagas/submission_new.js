/* eslint-disable no-underscore-dangle */
import { put, call, select, all, } from 'redux-saga/effects';
import Actions from '../actions/submission';
import ActionsCommon from '../actions/common';
import {
  actualizeDataOnFirestore,
  fetchSubmissionData,
} from '../../service/FirebaseInteraction';
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from '@react-native-async-storage/async-storage';
getUser = async () => {
  try {
    const user = await AsyncStorage.getItem('location')
    return user ? JSON.parse(user) : {};
  } catch (e) {
    console.log('Failed to fetch the data from storage');
  }
}

const takeFormEndpointFromState = state => state.form.formEndpoint;
const takeCurrentSubmissionFromState = state => state.submission;
const takeCurrentFormIdFromState = state => state.form.firebaseFormId;
const takeCurrentSlugIdFromState = state => state.form.slug;
const takeCurrentOrgSlugFromState = state => state.userreducer.organization;
export  function* updateSubmissionDataForPageOnCloud(action) {
  NetInfo.fetch().then(state => {
if(state.isConnected==false && action.status=='Ready'){
  alert("Since you are in offline mode information will be sync when you are connected to internet");
}
  });
  try {
    const currentSubmission = yield select(takeCurrentSubmissionFromState);
    const currentFormId = yield select(takeCurrentFormIdFromState);
    const currentSlugId = yield select(takeCurrentSlugIdFromState);
    const currentOrgSlug = yield select(takeCurrentOrgSlugFromState);

    const submissionId = yield call(actualizeDataOnFirestore,
      currentOrgSlug,currentSubmission, currentFormId, currentSlugId, action.status);

    if (action.status === 'Ready') {
      alert('Your form saved successfully');
    }
    if(submissionId!=undefined && submissionId!=null){
      yield put(Actions.updateFirebaseSubmissionId(submissionId));
    }
   
   
  } catch (e) {
    alert(e.message);
  }
}

export function* submitCurrentDataToFormio() {
  NetInfo.fetch().then(state => {
    if(state.isConnected==false ){
      alert("Since you are in offline mode information will be sync when you are connected to internet");
    }
      });
  const currentFormEndpoint = yield select(takeFormEndpointFromState);
  const currentSubmission = yield select(takeCurrentSubmissionFromState);
  const currentFormId = yield select(takeCurrentFormIdFromState);
  currentSubmission.formId = currentFormId;
  const currentSlugId = yield select(takeCurrentSlugIdFromState);
  const currentOrgSlug = yield select(takeCurrentOrgSlugFromState);
/*console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%");
  console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%");
  console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%");
console.log("currentSubmission"+currentSubmission);
console.log("currentSubmission.formId"+currentSubmission.formId);
console.log("currentSlugId"+currentSlugId);

  console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%");
  console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%");
  console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%");*/
  try {
    const currentSlugId2 = yield select(takeCurrentSlugIdFromState);
    yield call(actualizeDataOnFirestore,currentOrgSlug, currentSubmission, currentFormId, currentSlugId2, 'Uploading');
    const fieldForUpdate = [];
    if (currentSubmission.rawSubmission.data.length === 1 && currentSubmission.data.__root) {
      Object.keys(currentSubmission.rawSubmission.data.__root)
        .forEach((key) => {
          if (currentSubmission.rawSubmission.data.__root[key]
            && currentSubmission.rawSubmission.data.__root[key][0]
            && currentSubmission.rawSubmission.data.__root[key][0].notUpload) {
            fieldForUpdate.push({
              page: '__root',
              key,
              data: currentSubmission.rawSubmission.data.__root[key][0],
            });
          }
        });
    } else {
      Object.keys(currentSubmission.rawSubmission.data)
        .forEach((page) => {
          Object.keys(currentSubmission.rawSubmission.data[page])
            .forEach((key) => {
              if (currentSubmission.rawSubmission.data[page][key]
                && currentSubmission.rawSubmission.data[page][key][0]
                && currentSubmission.rawSubmission.data[page][key][0].notUpload) {
                fieldForUpdate.push({
                  page,
                  key,
                  data: currentSubmission.rawSubmission.data[page][key][0],
                });
              }
            });
        });
    }
   yield call(actualizeDataOnFirestore,currentOrgSlug, currentSubmission, currentFormId, currentSlugId2, 'Submitted');
    const preparedData = {
      data: {},
    };
    Object.values(currentSubmission.rawSubmission.data).forEach((page) => {
      Object.assign(preparedData.data, page);
    });
    console.log('TOSEND DATA' + JSON.stringify(preparedData.data));



    const data = new FormData();
    data.append('userId', 1);
    data.append('form', preparedData.data);
   /* if(preparedData.data.user){
      delete preparedData.data.user;
    }*/

    var tosend = JSON.stringify(preparedData.data);
    console.log('TOSEND' + JSON.stringify({
      userId: "1",
      form: tosend,
      _latitude: currentSubmission._latitude,
      _longitude: currentSubmission._longitude,

    }));
  /*  fetch(currentFormEndpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: "1",
       _latitude: currentSubmission._latitude,
        _longitude: currentSubmission._longitude,
        form: tosend,

      }),
    })
      .then((response) => response.json())
      .then((json) => {
        console.log("RETURN AAYO" + JSON.stringify(json));
        return json;
      })
      .catch((error) => {
        console.error(error);
      });*/
    const currentSlugId = yield select(takeCurrentSlugIdFromState);
  //  yield call(actualizeDataOnFirestore,currentSubmission, currentFormId, currentSlugId, 'Submitted');
   // yield call(actualizeDataOnFirestore, currentSubmission, currentSubmission.formId, currentSlugId, 'Submitted');
   yield call(actualizeDataOnFirestore,currentOrgSlug, currentSubmission, currentFormId, currentSlugId, 'Submitted');
    alert('Your form submitted successfully');
  } catch (e) {
    //.log("OPTeeeeeeeeeeeeeeeeIOeeeeeeeeN1" + JSON.stringify(e));
    //yield call(actualizeDataOnFirestore,currentSubmission, currentFormId, currentSlugId, 'Ready');
   // yield call(actualizeDataOnFirestore, currentSubmission, currentSubmission.formId, currentSlugId, 'Ready');
   yield call(actualizeDataOnFirestore,currentOrgSlug, currentSubmission, currentFormId, currentSlugId, 'Ready');
    if (e.message === 'Network Error') {
      alert('You\'re not connected to the internet now. When you reconnect, '
        + 'go to Submissions and click \'Submit\' to complete this submission.');
      return;
    }
    if (e.message === 'Request failed with status code 401') {
      alert('The form doesn\'t allow anonymous submitting. Please contact the form maintainer');
      return;
    }
    console.log("ERROR" + JSON.stringify(e));
    const errorDetailsText = e.response
      ? e.response.data.details.reduce((accum, val) => (
        `${accum + val.message}\n`
      ), '')
      : e.message;
    alert(
      `${e.response ? e.response.data.name : ''}\n
         ${errorDetailsText}`,
    );
  }
}

export function* fetchSubmissionDataFromCloud(action) {
  const currentOrgSlug = yield select(takeCurrentOrgSlugFromState);
  const submissionData = yield call(fetchSubmissionData,currentOrgSlug, action.submissionId, action.slug);

  yield put(Actions.updateSubmissionDataAllPagesLocally(submissionData));
}


export function* directSubmitDataFromCloudToFormio(action) {
  const currentOrgSlug = yield select(takeCurrentOrgSlugFromState);
  const submissionData = yield call(fetchSubmissionData,currentOrgSlug, action.submissionId, action.slug);
  submissionData.submissionId = action.submissionId;

  try {
    yield call(actualizeDataOnFirestore,currentOrgSlug, submissionData, submissionData.formId, action.slug, 'Uploading');
    const fieldForUpdate = [];
    Object.keys(submissionData.rawSubmission.data).forEach((page) => {
      Object.keys(submissionData.rawSubmission.data[page]).forEach((key) => {
        if (submissionData.rawSubmission.data[page][key]
          && submissionData.rawSubmission.data[page][key][0]
          && submissionData.rawSubmission.data[page][key][0].notUpload) {
          fieldForUpdate.push({ page, key, data: submissionData.rawSubmission.data[page][key][0] });
        }
      });
    });
    yield call(actualizeDataOnFirestore,currentOrgSlug, submissionData, submissionData.formId, action.slug, 'Uploading');
    const currentFormEndpoint = action.formEndpoint;
    const preparedData = {
      data: {},
    };
    Object.values(submissionData.rawSubmission.data).forEach((page) => {
      Object.assign(preparedData.data, page);
    });
    console.log('TOSEND' + JSON.stringify({
      userId: "1",
      form: tosend,
      _latitude: currentSubmission._latitude,
      _longitude: currentSubmission._longitude,

    }));
   /* if(preparedData.data.user){
      delete preparedData.data.user;
    }
    var tosend = JSON.stringify(preparedData.data);
    fetch(currentFormEndpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: "1",
        _latitude:'20',
        latitude:'30',
       _latitude: currentSubmission._latitude,
        _longitude: currentSubmission._longitude,
        form: tosend,

      }),
    })
      .then((response) => response.json())
      .then((json) => {
        console.log("RETURN AAYO" + JSON.stringify(json));
        return json;
      })
      .catch((error) => {
        console.error(error);
      });*/

    yield call(actualizeDataOnFirestore,currentOrgSlug, submissionData, submissionData.formId, action.slug, 'Submitted');
    alert('Your form submitted successfully');
  } catch (e) {
    yield call(actualizeDataOnFirestore,currentOrgSlug, submissionData, submissionData.formId, action.slug, 'Ready');
    const errorDetailsText = e.response
      ? e.response.data.details.reduce((accum, val) => (
        `${accum + val.message}\n`
      ), '')
      : e.message;
    alert(
      `${e.response ? e.response.data.name : ''}\n
         ${errorDetailsText}`,
    );
  } finally {
    yield put(ActionsCommon.suspendFormInteractionSession());
  }
}
