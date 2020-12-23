import ActionTypes from '../actions/actionTypes';
import { Alert } from 'react-native';
const submissionInitialState = {
  _latitude: null,
  _longitude: null,
  submissionId: null,
  isNew: true, // true if we haven't load any data about this submission to firebase
  status: undefined,
  rawSubmission: {
    data: {},
  },
};


export default function submission(state = submissionInitialState, action) {
  switch (action.type) {
    /* ---*---*---*--- */

   /* case ActionTypes.INITIALIZE_SUBMISSION: {
   
      const newState = {
        submissionId: action.submissionId,
        _longitude: action._longitude,
        _latitude: action._latitude,
      }
      console.log("REDUCER");
      console.log("nestate"+JSON.stringify(newState));
      return Object.assign({}, state, newState);
    }*/
    case ActionTypes.INITIALIZE_SUBMISSION2: {
  
//alert('initial');
      return {
        _latitude: null,
        _longitude: null,
        submissionId: null,
        isNew: true, // true if we haven't load any data about this submission to firebase
        status: undefined,
        rawSubmission: {
          data: {},
        },
      };
    }
    case ActionTypes.INITIALIZE_SUBMISSION: {
      const newState = {
        submissionId: action.submissionId,
      };

      return Object.assign({}, state, newState);
    }

    /* ---*---*---*--- */

    case ActionTypes.UPDATE_SUBMISSION_DATA_ALL_PAGES_LOCALLY: {
      const newState = Object.assign({}, state);
      newState.rawSubmission = action.data.rawSubmission;
      return newState;
    }

    /* ---*---*---*--- */

    case ActionTypes.UPDATE_SUBMISSION_DATA_FOR_PAGE_LOCALLY: {
      const newState = Object.assign({}, state);
      newState.rawSubmission.data[action.page] = action.data;
      return newState;
    }

    /* ---*---*---*--- */

    case ActionTypes.UPDATE_FIREBASE_SUBMISSION_ID: {
      const newState = Object.assign({}, state);
      newState.isNew = false;
      newState.submissionId = action.id;
      return newState;
    }

    /* ---*---*---*--- */

    case ActionTypes.SUSPEND_FORM_INTERACTION_SESSION: {
      const newState = Object.assign({}, submissionInitialState);
      newState.rawSubmission.data = {};
      return newState;
    }

    /* ---*---*---*--- */

    default:
      return state;
  }
}
