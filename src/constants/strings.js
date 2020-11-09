const ERROR_DEFAULT = 'Unknown error';
const ERROR_NEW_PASSWORDS_NOT_MATCH = 'New passwords does not match';
const ERROR_FILL_REQUIRED_FIELDS = 'All required fields must be filled';
const ERROR_FIELD_REQUIRED = 'This field is required.';
const ERROR_EMAIL = 'Incorrect email format.';
const ERROR_PASSWORD_LENGTH = 'Password should be at least 6 characters.';
const ERROR_FORM_LOADING_UNKNOWN = 'Sorry :(\nAn error occurred during form loading\nHere is some info:';


const SUCCESS_EDIT_EMAIL_FULL_NAME = 'Data updated successfully';

const INFO_PASSWORD_UPDATE_SUCCESS = 'Password update successful';

const EMAIL_RE = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export default {
  ERROR_DEFAULT,
  ERROR_NEW_PASSWORDS_NOT_MATCH,
  ERROR_FILL_REQUIRED_FIELDS,
  ERROR_FIELD_REQUIRED,
  ERROR_EMAIL,
  ERROR_PASSWORD_LENGTH,
  ERROR_FORM_LOADING_UNKNOWN,
  SUCCESS_EDIT_EMAIL_FULL_NAME,
  INFO_PASSWORD_UPDATE_SUCCESS,
  EMAIL_RE,
};
