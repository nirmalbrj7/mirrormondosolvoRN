import React from 'react';
import { Button} from 'react-native-elements/src/index';
import Icon from 'react-native-vector-icons/FontAwesome5';
import _ from 'lodash';
import {View,StyleSheet, Text} from 'react-native';
import MultiComponent from "../sharedComponents/Multi";
export default class Datagrid extends MultiComponent {
  constructor(props) {
    super(props);
    this.getInitialValue = this.getInitialValue.bind(this);
    this.getSingleElement = this.getSingleElement.bind(this);
    this.onConfirm = this.onConfirm.bind(this);
    this.handler = this.handler.bind(this);
  }

  getInitialValue(value) {
    alert("val"+JSON.stringify(value));
    if (!this.props) {
      return '';
    }
    if (value && value.item)
      return value.item;
  }
  handler = e => {
    const newstate = this.state.value.item;
    const filterout = newstate.filter((post) => e !== post.id);
    this.setValue(filterout);
    return true;
  };


  onConfirm(mycomp, index, param, currentState,type) {
    let prevData = currentState.value;
    let prevDatArray = prevData.item;
    this.props.navigation.setParams({ action: this.handler });
    if (prevDatArray) {
      if (prevDatArray[0]) {
        if (prevDatArray[0].length == 0) {
          prevDatArray = prevDatArray.filter(value => JSON.stringify(value) !== '[]');

        }
      }
    }
    if (prevDatArray == undefined) {
      var myarray = [];
      var myobj = {};


      mycomp.map((value, index) => {
        console.log("VAL" + JSON.stringify(value));

        myobj.id = Math.random();
        myobj[value.key] = '';

      });
      myarray.push(myobj);
      this.setValue(myarray, index);
      console.log(
        "listcomponent"+JSON.stringify(this.props),
        "newstate"+JSON.stringify(param),
        "ourcomponent"+JSON.stringify(mycomp),
        "parentKey"+key,
        "type"+type
      );
      this.props.navigation.navigate('ListRecord',{
        listcomponent:this.props,
        newstate:param,
        ourcomponent:mycomp,
        parentKey:key,
        type,
        onSelect: this.handler
      });
    }
    else {
      const key = this.props.component.key;
      const data = this.props.data;
      const newstate = this.state;
      var myobj = {};

      mycomp.map((value, index) => {
        myobj.id = Math.random();
        myobj[value.key] = '';

      });
      if (typeof prevDatArray == 'string') {
        prevDatArray = [];
      }
      prevDatArray.push(myobj);
      this.setValue(prevDatArray, index);
      console.log(
        "listcomponent"+JSON.stringify(this.props),
        "newstate"+JSON.stringify(param),
        "ourcomponent"+JSON.stringify(mycomp),
        "parentKey"+key,
        "type"+type
      );
      this.props.navigation.navigate('ListRecord',{
        listcomponent:this.props,
        newstate:param,
        ourcomponent:mycomp,
        parentKey:key,
        type,
        onSelect: this.handler
      });
    }
  }




  getSingleElement(value, index) {
  const {component, name, readOnly, colors, theme} = this.props;
    const label = component.label;
    const mycomp = component.components;
    const key = component.key;
    const key1 = component.key;
    const newstate = value.item?value.item:null;
    const level = component.properties.level;
    const levelInt = parseInt(level);
    const newstate2=JSON.stringify(this.state);
    alert(newstate2);
    let symbol = [];
    _.times(levelInt, () => {
      symbol.push(<Text>{'>'}</Text>);
    });
    const ButtonTitle=<Text>{label+''+levelInt }<Text>{symbol}</Text></Text>
    return (
      <View >
        <Button
          icon={
            <Icon
              name="edit"
              type='fontawesome'
              size={25}
              color="white"
            />
          }
          title={ButtonTitle}
          buttonStyle={{
            width: 250,
            marginTop: 10,
            marginHorizontal: 0,
            paddingHorizontal: 0,
            alignSelf: 'center',
            borderRadius: 6
          }}
          style={{ flex: 1, alignSelf: 'center' }}
          onPress={(e) => {alert("ssss"),this.onConfirm(mycomp, e, newstate, this.state,ButtonTitle)}}
          backgroundColor={'transparent'}
          color={this.props.colors.primary1Color}
        >
        </Button>
        <View style={{ marginHorizontal: 10 }}>
        <Text>{JSON.stringify(newstate)}</Text>
        </View>
        {/*
          newstate && newstate.length > 0 ?
            <ListCard listcomponent={this.props} newstate={newstate} ourcomponent={mycomp} parentKey={key1} action={this.handler} />
            : null
        */}
      </View>
    );
  }
}
const styles = StyleSheet.create({

});
