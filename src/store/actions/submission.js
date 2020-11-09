import ActionTypes from './actionTypes';
import { Alert } from 'react-native';
function initializeSubmission(submissionId, latitude, longitude) {
  console.log("--------------------------");
  console.log("--------------------------");
  console.log("--------------------------");
console.log('lat'+latitude);
console.log('submissionId'+submissionId);
  console.log("--------------------------");
  console.log("--------------------------");
  console.log("--------------------------");
  return {
    type: ActionTypes.INITIALIZE_SUBMISSION,
    submissionId,
    _latitude: latitude,
    _longitude: longitude,
  }
}

function updateSubmissionDataForPageLocally(page, data) {
  const dataCopy = Object.assign({}, data);
  return {
    type: ActionTypes.UPDATE_SUBMISSION_DATA_FOR_PAGE_LOCALLY,
    page,
    data: dataCopy,
  };
}

function updateSubmissionDataForPageOnCloud(status) {
  return {
    type: ActionTypes.UPDATE_SUBMISSION_DATA_FOR_PAGE_ON_CLOUD,
    status,
  };
}

function fetchSubmissionDataFromCloud(submissionId, slug) {
  return {
    type: ActionTypes.FETCH_SUBMISSION_DATA_FROM_CLOUD,
    submissionId,
    slug
  };
}

function updateSubmissionDataAllPagesLocally(data) {
  const dataCopy = Object.assign({}, data);
  return {
    type: ActionTypes.UPDATE_SUBMISSION_DATA_ALL_PAGES_LOCALLY,
    data: dataCopy,
  };
}

function updateFirebaseSubmissionId(id) {
  return {
    type: ActionTypes.UPDATE_FIREBASE_SUBMISSION_ID,
    id,
  };
}

function submitCurrentDataToFormio() {
  return {
    type: ActionTypes.SUBMIT_TO_FORMIO_CURRENT,
  };
}

function directSubmitDataFromCloudToFormio(submissionId, formEndpoint) {
  return {
    type: ActionTypes.DIRECT_SUBMIT_DATA_FROM_CLOUD_TO_FORMIO,
    submissionId,
    formEndpoint,
  };
}

export default {
  initializeSubmission,
  updateSubmissionDataForPageLocally,
  updateSubmissionDataForPageOnCloud,
  fetchSubmissionDataFromCloud,
  updateSubmissionDataAllPagesLocally,
  updateFirebaseSubmissionId,
  submitCurrentDataToFormio,
  directSubmitDataFromCloudToFormio,
};
