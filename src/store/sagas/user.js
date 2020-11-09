import {put} from 'redux-saga/effects';
import ActionsUser from '../actions/user';
export function* addUser(action) {
  yield put(ActionsUser.addUser(action));
}
export function* clearUser() {
  yield put(ActionsUser.clearUser());
}
export function* addUserSlug() {
  yield put(ActionsUser.addUserSlug(action));
}
export function* addUserEmail() {
  yield put(ActionsUser.addUserEmail());
}