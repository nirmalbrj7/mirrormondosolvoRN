import { combineReducers } from 'redux';

import form from './form';
import wizard from './wizard';
import submission from './submission';
import datagridreducer from './datagrid';

const rootReducer = combineReducers({
  form,
  wizard,
  submission,
  datagridreducer,
});

export default rootReducer;
