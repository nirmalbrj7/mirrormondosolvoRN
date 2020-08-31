import React from 'react';
import {useSelector,useDispatch} from 'react-redux';
import PropTypes from 'prop-types';
import {View,Text, Alert} from 'react-native';
import FormDisplayForm from './FormDisplayForm';
import WizardDisplayForm from './WizardDisplayForm';

const Form = () => {
  const dispatch = useDispatch();
  //dispatch({ type: 'clear_data',payload:'1' });

  const formDisplay = useSelector(
    state => state.form && state.form.form && state.form.form.display,
  );
  const formDisplay2 = useSelector(
    state => state.form,
  );



  return (
    formDisplay === 'wizard' ? <WizardDisplayForm /> : <FormDisplayForm />
  );
};

Form.propTypes = {
  formDisplay: PropTypes.string,
};

Form.defaultProps = {
  formDisplay: null,
};

export default Form;
