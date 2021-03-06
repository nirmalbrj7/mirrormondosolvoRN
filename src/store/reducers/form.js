import ActionTypes from '../actions/actionTypes';
import { FETCHABLE_DATA_STATUS } from '../../constants/values';
const formInitialState = {
  inAppFormName: '',
  formEndpoint: null,
  firebaseFormId: undefined,
  formDataStatus: FETCHABLE_DATA_STATUS.EMPTY,
  formDataErrorMessage: null,
  form: null,
  datagrid:null,
  slug:null
};

export default function form(state = formInitialState, action) {
  switch (action.type) {
    case ActionTypes.TRY_UPDATE_CURRENT_FORM: {     
      const newState = {
        formEndpoint: action.formEndpoint,
      };
      if (state.formDataStatus !== FETCHABLE_DATA_STATUS.EMPTY) {
        newState.formDataStatus = FETCHABLE_DATA_STATUS.NOT_ACTUAL;
      }
      return Object.assign({}, state, newState);
    }

    /* ---*---*---*--- */

    case ActionTypes.SET_CURRENT_FORM_DATA: {
      const newState = {
        inAppFormName: action.formName,
        firebaseFormId: action.firebaseFormId,
        datagrid:action.datagrid,
        slug:action.slug
      };
      return Object.assign({}, state, newState);
    }

    /* ---*---*---*--- */

    case ActionTypes.SET_FORM_DATA_STATUS: {  
      return Object.assign({}, state, { formDataStatus: action.status });
    }

    /* ---*---*---*--- */

    case ActionTypes.FORM_FETCH_DONE: {
      const newState = {};
      if (action.success) {
        newState.formDataStatus = FETCHABLE_DATA_STATUS.SUCCESS;
        newState.form = action.payload;
        newState.formDataErrorMessage = null;
      } else {
        newState.formDataStatus = FETCHABLE_DATA_STATUS.FAIL;
        newState.form = null;
        newState.formDataErrorMessage = action.payload;
      }
      return Object.assign({}, state, newState);
    }

    /* ---*---*---*--- */

    case ActionTypes.SUSPEND_FORM_INTERACTION_SESSION: {
      return formInitialState;
    }

    /* ---*---*---*--- */

    default:
      return state;
  }
}
