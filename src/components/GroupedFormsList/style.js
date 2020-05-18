import { StyleSheet } from 'react-native';

import Colors from '../../constants/colors';

const styles = StyleSheet.create({
  groupsListContainer: {
  //  marginHorizontal: 10,
    marginTop: 5,
    marginBottom: 30,
  },
  groupsListItemContainer: {
    marginTop: 15,
  },
  formsListContainer: {
    marginTop: 10,
   // borderBottomWidth: 1,
  },
  formsListItem: {
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 15,
    paddingVertical: 15,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formsListItemText: {
    fontSize: 20,
    color: Colors.FORM_GROUP_ITEM_TEXT_COLOR,
  },
  formsListIcon: {
    width: 40,
    height: 40,
  },
});

export default styles;
