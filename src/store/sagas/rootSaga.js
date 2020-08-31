import { takeEvery } from 'redux-saga/effects';

import Actions from '../actions/actionTypes';
import { fetchForm, tryUpdateCurrentForm } from './form';
import {
  submitCurrentDataToFormio,
  updateSubmissionDataForPageOnCloud,
  fetchSubmissionDataFromCloud,
  directSubmitDataFromCloudToFormio,
} from './submission';


export default function* watcherSaga() {
  yield takeEvery(Actions.TRY_UPDATE_CURRENT_FORM, tryUpdateCurrentForm);
  yield takeEvery(Actions.FETCH_FORM, fetchForm);
  yield takeEvery(Actions.SUBMIT_TO_FORMIO_CURRENT, submitCurrentDataToFormio);
  yield takeEvery(
    Actions.UPDATE_SUBMISSION_DATA_FOR_PAGE_ON_CLOUD,
    updateSubmissionDataForPageOnCloud,
  );
  yield takeEvery(Actions.FETCH_SUBMISSION_DATA_FROM_CLOUD, fetchSubmissionDataFromCloud);
  yield takeEvery(Actions.DIRECT_SUBMIT_DATA_FROM_CLOUD_TO_FORMIO, directSubmitDataFromCloudToFormio);
}
