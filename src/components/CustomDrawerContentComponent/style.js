import { StyleSheet } from 'react-native';

import Colors from '../../constants/colors';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  drawerHeader: {
    fontSize: 20,
  //  height: 56,
    display: 'flex',
    marginBottom:5
   // justifyContent: 'center',
    //alignItems: 'center',
    //textAlign:'center'
  },
  drawerHeaderText: {
    fontSize: 20,
    fontWeight: '500',
    color: Colors.DRAWER_HEADER_TEXT_COLOR,
    textAlign:'center'
  },
  drawerHeaderSubText:{
    fontSize: 14,
    fontWeight: '500',
    color: Colors.DRAWER_HEADER_TEXT_COLOR,
   // textAlign:'center'
  }
});

export default styles;
