import { StyleSheet } from 'react-native';

import Colors from '../../constants/colors';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  textInput: {
    height: 40,
    width: '100%',
    borderColor: Colors.INPUT_BORDER_COLOR,
    borderWidth: 1,
    marginTop: 8,
    paddingHorizontal: 10,
  },
  errorMessageText: {
    color: Colors.ERROR_TEXT_COLOR,
    width: '100%',
    textAlign: 'center',
  },
  errorMessageTextLeft: {
    color: Colors.ERROR_TEXT_COLOR,
    textAlign: 'left',
    width: '100%',
  },
  buttonsSectionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
});

export default styles;
