import { StyleSheet } from 'react-native'; // full height

import Dimen from '../../../constants/dimen';

const styles = StyleSheet.create({
  progressBarContainer: {
    width: Dimen.WINDOW_WIDTH,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginHorizontal: -Dimen.SCREEN_PADDING_HORIZONTAL,
  },
});

export default styles;
