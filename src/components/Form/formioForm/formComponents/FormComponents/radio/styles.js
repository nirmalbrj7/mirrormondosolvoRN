import {StyleSheet} from 'react-native';

const styles = StyleSheet.create({
  radioForm: {
    flex: 1,
    marginTop: 10,
    paddingRight: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: 'grey',
  },
  radioButton: {
    marginLeft: 0,
    padding: 10,
    marginRight: 'auto',
    justifyContent: 'flex-start',
  },
  label: {
    fontSize: 14,
    marginHorizontal: 10,
  },
  radioButtonWrap: {
    marginLeft: 10,
  },
});

export default styles;
