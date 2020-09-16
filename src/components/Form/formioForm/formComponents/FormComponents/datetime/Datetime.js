import React from 'react';
import DateTimePicker from 'react-native-modal-datetime-picker';


import DatePicker from 'react-native-modern-datepicker';
import {View, Text, Alert} from 'react-native';
import {Button} from 'react-native-elements';
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
    this.handleConfirm = this.handleConfirm.bind(this);
    
  }

  getInitialValue(value) {
    if (!this.props) {
      return undefined;
    }
    const dateFormat = this.props.component.dateFirst
      ? 'DD/MM/YYYY'
      : 'MM/DD/YYYY';
    if (value && value.item && moment(value.item, dateFormat).isValid()) {
      return moment(value.item, dateFormat).toDate();
    }
    if (this.props.component.defaultDate) {
      return moment(this.props.component.defaultDate, dateFormat).toDate();
    }
    return undefined;
  }

  getMode() {
    switch (this.props.component.type) {
      case 'datetime':
        return 'datetime';
      case 'day':
        return 'date';
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
        return 'MMMM DD, YYYY';
      case 'time':
        return 'hh:mm A';
      default:
        return 'MMMM DD, YYYY';
    }
  }

  getResultFormat() {
    const {dateFirst} = this.props.component;
    switch (this.props.component.type) {
      case 'datetime':
        return dateFirst ? 'DD/MM/YYYY : hh:mm A' : 'MM/DD/YYYY : hh:mm A';
      case 'day':
        return dateFirst ? 'DD/MM/YYYY' : 'MM/DD/YYYY';
      case 'time':
        return 'hh:mm A';
      default:
        return dateFirst ? 'DD/MM/YYYY' : 'MM/DD/YYYY';
    }
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
      this.setValue(value.toISOString(), index);
    }
    this.setState({
      open: false,
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
   handleConfirm = (value) => {
    this.setState({
      open: false
      
    });
     console.log('datevalue'+JSON.stringify(value));
    
    const selected = moment(value);
    this.setValue(value);
    /*const dateFormat = this.getResultFormat();
    if (selected.isValid()) {
      const date = selected.format(dateFormat).toString();
      this.setValue(date);
    } else {
      // this fixes date module returning invalid date
      // if confirm button was pressed without touching date picker.
      value = moment()
        .format(dateFormat)
        .toString();
      this.setValue(value.toISOString());
    }
    this.hideDatePicker();*/
  //r  this.hideDatePicker();
  this.setState({
    open: false
    
  });
  };

  getSingleElement(value, index) {
    const {component, name, readOnly} = this.props;
    const dateFormat = this.props.component.dateFirst
      ? 'DD/MM/YYYY'
      : 'MM/DD/YYYY';
    const dateTimeFormat = `${dateFormat} : hh:mm A`;
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
          titleStyle={{color: 'black'}}
          buttonStyle={{
            justifyContent: 'space-between',
            paddingLeft: 30,
            borderColor: 'grey',
            backgroundColor:'#fff'
          }}
          containerStyle={{marginTop: 20}}
          disabled={readOnly}
          //onPress={this.togglePicker}
          onPress={this.showDatePicker}
          containerViewStyle={styles.button}
          title={
            this.state.value && this.state.value.item
              ? 
              /*moment(this.state.value.item, dateTimeFormat).format(
                  this.getDisplayFormat(),
                )*/
                moment(this.state.value.item).format( this.getDisplayFormat())
              : component.type === 'day'
              ? 'Select date'
              : 'Select date and time'
          }
          color={this.props.colors.primary1Color}
        />
     



          <DateTimePicker
        isVisible={this.state.open}
        key="component"
        data-index={index}
        name={name}
        placeholder={component.placeholder}
        pickerRefCb={ref => (this.datepicker = ref)}
        minuteInterval={
          this.props.component.timePicker
            ? this.props.component.timePicker.minuteStep
            : 5
        }
        mode={this.getMode}
        date={this.getInitialValue(value)}
        onConfirm={this.handleConfirm}
        onCancel={this.hideDatePicker}
      />
      
      </View>
    );
  }
}
