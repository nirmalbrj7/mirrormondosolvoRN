import ActionTypes from './actionTypes';

function suspendFormInteractionSession() {
  return {
    type: ActionTypes.SUSPEND_FORM_INTERACTION_SESSION,
  };
}

export default {
  suspendFormInteractionSession,
};
