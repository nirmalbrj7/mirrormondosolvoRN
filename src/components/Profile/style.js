import { StyleSheet } from 'react-native';

import Colors from '../../constants/colors';

const styles = StyleSheet.create({
  textInput: {
    height: 40,
    borderColor: Colors.INPUT_BORDER_COLOR,
    borderWidth: 1,
    marginTop: 8,
    paddingHorizontal: 10,
    width: '100%',
  },
  headSectionContainer: {
    marginRight: 'auto',
  },
  contentContainer: {
    flex: 1,
    padding: 16,
    paddingTop: 30,
    alignItems: 'center',
    backgroundColor: Colors.BASIC_CONTAINER_BACKGROUND_COLOR,
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
  successMessageText: {
    color: Colors.SUCCESS_TEXT_COLOR,
    textAlign: 'center',
    width: '100%',
  },
  tableContainer: {
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 30,
  },
  tableBorder: {
    borderWidth: 2,
    borderColor: Colors.TABLE_BORDER,
  },
  tableHead: {
    height: 40,
    backgroundColor: Colors.TABLE_CELL_BACKGROUND_HEAD,
  },
  tableRow: { flexDirection: 'row' },
  tableText: {
    margin: 6,
    fontSize: 12,
  },
  inTableButton: {
    borderRadius: 0,
    height: 60,
  },
  changePasswordErrorMessage: {
    color: Colors.ERROR_TEXT_COLOR,
    width: '100%',
  },
  changePasswordErrorMessageLeft: {
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
