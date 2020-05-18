 
import {put, select} from 'redux-saga/effects';
import ActionsForm from '../actions/form';
import ActionsSubmission from '../actions/submission';
import {takeCurrentFormDefinitionFromState} from './selects';

export function* initNewSubmissionSession() {
  const currentForm = yield select(takeCurrentFormDefinitionFromState);
  yield put(ActionsForm.evaluateWizardPages(currentForm));
  yield put(ActionsSubmission.initializeSubmissionReducer());
}