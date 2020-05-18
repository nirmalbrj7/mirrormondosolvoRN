import {StyleSheet} from 'react-native';

import Colors from '../constants/colors';
import Dimen from '../constants/dimen';

const styles = StyleSheet.create({
  rootAppView: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.BASIC_CONTAINER_BACKGROUND_COLOR,
    paddingVertical: 15,
    paddingHorizontal: Dimen.SCREEN_PADDING_HORIZONTAL,
  },
  screenContainerNoPadding: {
    flex: 1,
    backgroundColor: Colors.BASIC_CONTAINER_BACKGROUND_COLOR,
  },
  screenContainerScrollView: {
    backgroundColor: Colors.BASIC_CONTAINER_BACKGROUND_COLOR,
  },
  scrollableTableContainer: {
    flex: 1,
    backgroundColor: Colors.BASIC_CONTAINER_BACKGROUND_COLOR,
    paddingVertical: 30,
  },
  loaderScreenCentered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
    color: Colors.STANDARD_TEXT_COLOR,
    fontWeight: 'normal',
  },

  header1: {
    color: Colors.HEADER_TEXT_COLOR,
    fontSize: 34,
    fontWeight: 'bold',
  },
  header2: {
    color: Colors.HEADER_TEXT_COLOR,
    fontSize: 28,
    fontWeight: 'bold',
  },
  header3: {
    marginTop: 10,
    color: Colors.HEADER_TEXT_COLOR,
    fontSize: 24,
    fontWeight: 'bold',
    alignSelf: 'center',
  },
  button: {
    margin: 5,
  },
  successText: {
    fontWeight: 'bold',
    color: Colors.SUCCESS_TEXT_COLOR,
  },
  errorText: {
    fontWeight: 'bold',
    color: Colors.ERROR_TEXT_COLOR,
  },
});

export default styles;
