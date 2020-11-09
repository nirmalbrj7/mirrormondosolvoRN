import {put} from 'redux-saga/effects';
import ActionsSingleSubmission from '../actions/singlesubmission';
export function* addSingleSumission(action) {
  yield put(ActionsSingleSubmission.addSingleSubmission(action));
}
export function* clearSingleSumission() {
  yield put(ActionsSingleSubmission.clearSingleSubmission());
}