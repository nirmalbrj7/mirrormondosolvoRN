import React from 'react';
import DateTimePicker from 'react-native-modal-datetime-picker';
import { View, Text } from 'react-native';
import { Button, Input } from 'react-native-elements/src/index';

import moment from 'moment';
import Icon from 'react-native-vector-icons/FontAwesome5';
//import styles from './styles';
import MultiComponent from '../sharedComponents/Multi';

export default class File extends MultiComponent {
  constructor(props) {
    super(props);
    this.getInitialValue = this.getInitialValue.bind(this);

    this.onConfirm = this.onConfirm.bind(this);

    this.getSingleElement = this.getSingleElement.bind(this);
  }

  getInitialValue(value) {
    if (!this.props) {
      return '';
    }
    if (value && value.item)
      return value.item;
  }


  onConfirm(value, index) {
    const selected = moment(value);
    const dateFormat = this.getResultFormat();
    if (selected.isValid()) {
      const date = selected.format(dateFormat).toString();
      this.setValue(date, index);
    } else {
      // this fixes date module returning invalid date
      // if confirm button was pressed without touching date picker.
      value = moment()
        .format(dateFormat)
        .toString();
      //  this.setValue(value.toISOString(), index);
    }
    this.setState({
      open: false,
    }, console.log("herecon" + this.state.open));
  }


  getSingleElement(value, index) {
    const { component, name, readOnly } = this.props;

    return (
      <View style={{}}>
        <Text>ss{JSON.stringify(this.state.value.item)}</Text>
        <Input
          placeholder="Comment"
          leftIcon={{ type: 'font-awesome', name: 'comment' }}
          //style={styles}
          value={this.state.value && this.state.value.item ? this.state.value.item : null}
          onChangeText={value => this.setValue(value)}
        />
      </View>
    );
  }
}
