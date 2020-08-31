import { StyleSheet } from 'react-native';

import Colors from '../../constants/colors';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  drawerHeader: {
    height: 56,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign:'center'
  },
  drawerHeaderText: {
    fontSize: 20,
    fontWeight: '500',
    color: Colors.DRAWER_HEADER_TEXT_COLOR,
    textAlign:'center'
  },
});

export default styles;
