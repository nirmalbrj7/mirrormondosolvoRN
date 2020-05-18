import React from 'react';
import {useSelector,useDispatch} from 'react-redux';
import PropTypes from 'prop-types';
import {View,Text} from 'react-native';
import FormDisplayForm from './FormDisplayForm';
import WizardDisplayForm from './WizardDisplayForm';

const Form = () => {
  const dispatch = useDispatch();
  //dispatch({ type: 'clear_data',payload:'1' });

  const formDisplay = useSelector(
    state => state.form && state.form.form && state.form.form.display,
  );
  const newform=useSelector(state=>state);

  return (
    formDisplay &&
    (formDisplay === 'form' ? <FormDisplayForm /> : <WizardDisplayForm />)
  );
};

Form.propTypes = {
  formDisplay: PropTypes.string,
};

Form.defaultProps = {
  formDisplay: null,
};

export default Form;
