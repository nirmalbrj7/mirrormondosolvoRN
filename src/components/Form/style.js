import { StyleSheet } from 'react-native';

import Dimen from '../../constants/dimen';
import Colors from '../../constants/colors';

const styles = StyleSheet.create({
  fromFlowWizardContainer: {
    flex: 1,
    display: 'flex',
  },
  progressBarContainer: {
    width: '100%',
  },
  buttonBar: {
    marginTop: 'auto',
    marginBottom:10,
    paddingTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    backgroundColor: Colors.BASIC_CONTAINER_BACKGROUND_COLOR,
  },
  wizardPageContainer: {
    flex: 1,
    marginHorizontal: -Dimen.SCREEN_PADDING_HORIZONTAL,
  },
  previousButton: {
    width: '30%',
    marginRight: 'auto',
  },
  saveButton: {
    width: '30%',
  },
  nextButton: {
    width: '30%',
    marginLeft: 'auto',
  },
});

export default styles;
