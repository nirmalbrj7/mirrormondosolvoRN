import ActionTypes from './actionTypes';
function tryUpdateCurrentForm({ form, formEndpoint }) {
  return {
    type: ActionTypes.TRY_UPDATE_CURRENT_FORM,
    formEndpoint,
    form,
  };
}

function setCurrentFormEndpoint(formEndpoint) {
  return {
    type: ActionTypes.SET_CURRENT_FORM_ENDPOINT,
    formEndpoint,
  };
}

function setCurrentFormData(name, firebaseId,datagrid,slug) {
  return {
    type: ActionTypes.SET_CURRENT_FORM_DATA,
    formName: name,
    firebaseFormId: firebaseId,
    datagrid:datagrid,
    slug:slug
  };
}

function setFormDataStatus(status) {
  return {
    type: ActionTypes.SET_FORM_DATA_STATUS,
    status,
  };
}

function fetchForm(formEndpoint) {
  return {
    type: ActionTypes.FETCH_FORM,
    formEndpoint,
  };
}

function formFetchDone(success, payload) {
  return {
    type: ActionTypes.FORM_FETCH_DONE,
    success,
    payload,
  };
}

function setWizardPages(pages) {
  return {
    type: ActionTypes.SET_WIZARD_PAGES,
    pages,
  };
}

function jumpToWizardPage(page) {
  return {
    type: ActionTypes.JUMP_TO_WIZARD_PAGE,
    page,
  };
}

export default {
  tryUpdateCurrentForm,
  setCurrentFormEndpoint,
  setCurrentFormData,
  setFormDataStatus,
  formFetchDone,
  setWizardPages,
  jumpToWizardPage,
};
