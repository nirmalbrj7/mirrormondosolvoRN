import React from 'react';
import DateTimePicker from 'react-native-modal-datetime-picker';


import { View, Text, Alert } from 'react-native';
import { Button } from 'react-native-elements';
import moment from 'moment';
import Icon from 'react-native-vector-icons/FontAwesome5';
import styles from './styles';
import MultiComponent from '../sharedComponents/Multi';

export default class Datetime extends MultiComponent {
  constructor(props) {

    super(props);
    this.getInitialValue = this.getInitialValue.bind(this);
    this.getMode = this.getMode.bind(this);
    this.getDisplayFormat = this.getDisplayFormat.bind(this);
    this.getResultFormat = this.getResultFormat.bind(this);
    this.onConfirm = this.onConfirm.bind(this);
    this.togglePicker = this.togglePicker.bind(this);
    this.getSingleElement = this.getSingleElement.bind(this);
  }

  getInitialValue(value) {
    //alert('aa'+JSON.stringify(value));
    if (!this.props) {
      return moment().toDate();
    }

    const dateFormat = this.props.component.dateFirst ? 'DD/MM/YYYY' : 'MM/DD/YYYY';
    if (value && value.item && moment(value.item, dateFormat).isValid()) {


      return moment(value.item, dateFormat).toDate();
    }
    else if (this.props.component.defaultDate) {
      return moment(this.props.component.defaultDate, dateFormat).toDate();
    }
    else {
      return moment().toDate();
    }

  }

  getMode() {
    switch (this.props.component.type) {
      case 'datetime':
        return 'datetime';
      case 'day':
        return 'datetime';
      case 'time':
        return 'time';
      default:
        return 'date';
    }
  }

  getDisplayFormat() {
    switch (this.props.component.type) {
      case 'datetime':

        return 'MMMM DD, YYYY hh:mm A';
      case 'day':
        return 'MMMM DD, YYYY hh:mm A';
      case 'time':
        return 'hh:mm A';
      default:
        return 'MMMM DD, YYYY';
    }
    // return 'MMMM DD, YYYY';
  }

  getResultFormat() {
    const dateFirst = this.props.component.dateFirst;
    switch (this.props.component.type) {
      case 'datetime':
        // return dateFirst ? 'DD/MM/YYYY' : 'MM/DD/YYYY';
        return dateFirst ? 'DD/MM/YYYY  HH:mm:ss' : 'MM/DD/YYYY  HH:mm:ss';
      case 'day':
        return dateFirst ? 'DD/MM/YYYY  HH:mm:ss' : 'MM/DD/YYYY  HH:mm:ss';
      case 'time':
        return 'hh:mm A';
      default:
        return dateFirst ? 'DD/MM/YYYY' : 'MM/DD/YYYY';
    }
    // return dateFirst ? 'DD/MM/YYYY' : 'MM/DD/YYYY';
  }

  onConfirm(value, index) {
    console.log("11" + value);
    this.setState({
      open: false

    });
    const selected = moment(value);
    console.log("22" + selected);
    const dateFormat = this.getResultFormat();
    if (selected.isValid()) {
      const date = selected.format(dateFormat).toString();
      var ddd = moment(value).toISOString();
      //this.setValue(ddd)
     // firestore.Timestamp.fromDate(new Date()).toDate());
      this.setValue(moment(value).format())
    }
    else {
      value = moment().format(dateFormat).toString();
      //this.setValue(moment().toISOString());
      this.setValue(moment().format());
    }
    this.setState({
      open: false

    });
  }


  togglePicker() {

    this.setState({
      open: true,
    }, console.log("here" + this.state.open))

  }
  showDatePicker = () => {
    this.setState({
      open: true,
    });
  };

  hideDatePicker = () => {
    this.setState({
      open: false,

    });
  };

  getSingleElement(value, index) {

    const { component, name, readOnly } = this.props;
    const dateFormat = this.props.component.dateFirst ? 'DD/MM/YYYY  HH:mm:ss' : 'MM/DD/YYYY  HH:mm:ss';
    const newdate = this.state.value.item;
    return (
      <View style={styles.date}>
        <Button
          icon={
            <Icon
              name={component.type === 'day' ? 'calendar-alt' : 'calendar-plus'}
              size={30}
            />
          }
          type="outline"
          iconRight
          titleStyle={{ color: 'black' }}
          buttonStyle={{
            justifyContent: 'space-between',
            paddingLeft: 30,
            borderColor: 'grey',
            backgroundColor: '#fff'
          }}
          containerStyle={{ marginTop: 20 }}
          disabled={readOnly}
          //onPress={this.togglePicker}
          onPress={this.togglePicker}
          containerViewStyle={styles.button}
          title={
            this.state.value && this.state.value.item
              ?
              /*moment(this.state.value.item, dateTimeFormat).format(
                  this.getDisplayFormat(),
                )*/
              moment(this.state.value.item).format(this.getDisplayFormat())
              //this.state.value.item
              //moment(this.state.value.item).format(this.getDisplayFormat())
              : component.type === 'day'
                ? 'Select date'
                : component.type === 'time' ? 'Select Time' : 'Select date and time'
          }
          color={this.props.colors.primary1Color}
        />







        <DateTimePicker
          isVisible={this.state.open}
          key="component"
          data-index={index}
          name={name}
          placeholder={component.placeholder}
          pickerRefCb={(ref) => this.datepicker = ref}
          minuteInterval={this.props.component.timePicker ? this.props.component.timePicker.minuteStep : 5}
          // mode="date"
          mode={this.getMode()}
          date={this.getInitialValue(value)}
          onCancel={this.togglePicker}
          onConfirm={this.onConfirm}

          //onConfirm={this.handleConfirm}
          onCancel={this.hideDatePicker}
        />
      </View>
    );
  }

}
