import { combineReducers } from 'redux';

import form from './form';
import wizard from './wizard';
import submission from './submission';
import datagridreducer from './datagrid';
import resourcereducer from './resource';
const rootReducer = combineReducers({
  form,
  wizard,
  submission,
  datagridreducer,
  resourcereducer
});

export default rootReducer;
