import ActionTypes from './actionTypes';
function addUser(data) {

  return {
    type: ActionTypes.ADD_USER,
    data
  };
}
function addUserEmail(data) {

  return {
    type: ActionTypes.ADD_USER_EMAIL,
    data
  };
}
function addUserSlug(data) {

  return {
    type: ActionTypes.ADD_USER_SLUG,
    data
  };
}
function clearUser() {
  return {
    type: ActionTypes.CLEAR_USER
  };
}
export default {
    addUser,
    clearUser,
    addUserEmail,
    addUserSlug

};
