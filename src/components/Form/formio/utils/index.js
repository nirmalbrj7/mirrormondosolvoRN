import * as FormioUtils from './utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
if (typeof global === 'object') {
  global.FormioUtils = FormioUtils;
}
export default FormioUtils;
