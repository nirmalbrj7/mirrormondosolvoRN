import ActionTypes from './actionTypes';
function addSingleSubmission(data) {
  return {
    type: ActionTypes.ADD_SINGLE_SUBMISSION,
    data
  };
}

function clearSingleSubmission() {
  return {
    type: ActionTypes.CLEAR_SINGLE_SUBMISSION
  };
}
export default {
    addSingleSubmission,
    clearSingleSubmission,
};
