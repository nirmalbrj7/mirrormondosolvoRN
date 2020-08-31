import { put, call } from 'redux-saga/effects';
import Actions from '../actions/form';
import { FETCHABLE_DATA_STATUS } from '../../constants/values';

export function* evaluatePages(form) {
  const pages = yield form.components
    .filter(component => component.type === 'panel')
    .map(component => ({
      title: component.title,
      key: component.key,
    }));   
  yield put(Actions.setWizardPages(pages));
}

export function* fetchForm(form) {
  try {
    yield put(Actions.formFetchDone(true, form));
    yield call(evaluatePages, form);
  } catch (e) {
    yield put(Actions.formFetchDone(false, e.message));
  }
}

export function* tryUpdateCurrentForm({ form, formEndpoint }) {
  yield put(Actions.setFormDataStatus(FETCHABLE_DATA_STATUS.LOADING));
  yield put(Actions.setCurrentFormEndpoint(formEndpoint));
  yield call(fetchForm, JSON.parse(form));
}
