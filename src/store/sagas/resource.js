import {put} from 'redux-saga/effects';
import ActionsResource from '../actions/resource';
export function* addResource(action) {
  yield put(ActionsResource.addResource(action));
}
export function* clearResource() {
  yield put(ActionsResource.clearResource());
}