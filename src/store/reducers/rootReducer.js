import { combineReducers } from 'redux';

import form from './form';
import wizard from './wizard';
import submission from './submission';
import datagridreducer from './datagrid';
import resourcereducer from './resource';
import singlesubmissionreducer from './singleSubmission';
const rootReducer = combineReducers({
  form,
  wizard,
  submission,
  datagridreducer,
  resourcereducer,
  singlesubmissionreducer
});

export default rootReducer;
