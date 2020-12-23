import React from 'react';
import {useSelector,useDispatch} from 'react-redux';
import PropTypes from 'prop-types';
import {View,Text, Alert} from 'react-native';
import FormDisplayForm from './FormDisplayForm';
import WizardDisplayForm from './WizardDisplayForm';
import { useNavigation } from '@react-navigation/native';
const Form = (props) => {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const formDisplay = useSelector(
    state => state.form && state.form.form && state.form.form.display,
  );
  const formDisplay2 = useSelector(
    state => state.form,
  );



  return (
    formDisplay === 'wizard' ? <WizardDisplayForm navigation={navigation}/> : <FormDisplayForm navigation={navigation}/>
  );
};

Form.propTypes = {
  formDisplay: PropTypes.string,
};

Form.defaultProps = {
  formDisplay: null,
};

export default Form;
