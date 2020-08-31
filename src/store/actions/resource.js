import ActionTypes from './actionTypes';
function addResource(data) {
  return {
    type: ActionTypes.ADD_RESOURCE,
    data
  };
}

function clearResource() {
  return {
    type: ActionTypes.CLEAR_RESOURCE
  };
}
export default {
    addResource,
    clearResource,
};
