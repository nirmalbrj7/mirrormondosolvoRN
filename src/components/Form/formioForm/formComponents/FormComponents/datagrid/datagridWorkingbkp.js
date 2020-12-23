import React, { useEffect } from 'react';
import DateTimePicker from 'react-native-modal-datetime-picker';

import { Button, Input } from 'react-native-elements/src/index';

import moment from 'moment';
import Icon from 'react-native-vector-icons/FontAwesome5';
//import styles from './styles';





import { SafeAreaView, View, FlatList, StyleSheet, Text, Image, Alert } from 'react-native';
import { Avatar, Card, Title, Paragraph, IconButton } from 'react-native-paper';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { useSelector, useDispatch } from 'react-redux';

import MultiComponent from "../sharedComponents/Multi";
import { FormioComponents } from './../../../factories/FormioComponents';
import InitData from './initData';
import ListCard from './listCard';
import ClearData from './clearData';
import AddCard from './addCard';
import Myglobal from '../../../../global';
import Modal from 'react-native-modal';


export default class Datagrid extends MultiComponent {
  constructor(props) {
    super(props);
    this.getInitialValue = this.getInitialValue.bind(this);

    //this.onConfirm = this.onConfirm.bind(this);

    this.getSingleElement = this.getSingleElement.bind(this);
    this.onConfirm = this.onConfirm.bind(this);
    this.handler = this.handler.bind(this);
  }

  getInitialValue(value) {
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
  };


  onConfirm(mycomp, index, param, currentState) {
    let prevData = currentState.value;

    let prevDatArray = prevData.item;


    if (prevDatArray) {
      if (prevDatArray[0]) {
        if (prevDatArray[0].length == 0) {
          prevDatArray = prevDatArray.filter(value => JSON.stringify(value) !== '[]');

        }
      }
    }

    //   alert(JSON.stringify(prevData));
    if (prevDatArray == undefined) {
      var myarray = [];
      var myobj = {};


      mycomp.map((value, index) => {
        console.log("VAL" + JSON.stringify(value));

        myobj.id = Math.random();
        myobj[value.key] = '';

      });
      myarray.push(myobj);
      //alert(JSON.stringify(myarray));

      // alert('1w'+JSON.stringify(myarray));
      this.setValue(myarray, index);
    }
    else {
      //  alert(JSON.stringify(prevDatArray));
      const key = this.props.component.key;
      const data = this.props.data;
      const newstate = this.state;
      var myobj = {};

      mycomp.map((value, index) => {
        console.log("VAL2" + JSON.stringify(value));

        myobj.id = Math.random();
        myobj[value.key] = '';

      });
      //let prevDatArray = prevData.item;f

      if (typeof prevDatArray == 'string') {
        prevDatArray = [];
      }
      /*  if(prevDatArray[0].length==0){
  delete prevDatArray[0];
        }*/
      prevDatArray.push(myobj);
      // mycomp.push(mycomp[0]);
      //   alert('2'+JSON.stringify(prevDatArray));
      this.setValue(prevDatArray, index);

      /*    var myarray=[];
       myarray.push(prevDatArray)
       var myobj={};
   
   
       mycomp.map((value,index)=>{
         
         myobj.id=Math.random();
         myobj[value.key]='';
        
       });
       [...prevDatArray,myobj]
   
       myarray.push(myobj)
       
       this.setValue(myarray, index);*/
    }

  }




  getSingleElement(value, index) {


    const {
      component, name, readOnly, colors, theme
    } = this.props;
    const label = component.label;
    //const fieldValue = typeof value === 'object' ? value.item : value;
    //index = index || 0;
    const mycomp = component.components;
    const key = component.key;
    const key1 = component.key;
    ///const data1=this.props.data;
    const newstate = value.item;
    //var newstate = newstate2.filter(value => JSON.stringify(value) !== '[]');
    //var newstate2 =  newstate.filter(e => e.length);
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
          title="AddCard"
          buttonStyle={{
            width: 250,
            marginTop: 10,
            marginHorizontal: 0,
            paddingHorizontal: 0,
            alignSelf: 'center',
            borderRadius: 6
          }}
          style={{ flex: 1, alignSelf: 'center' }}
          onPress={(e) => this.onConfirm(mycomp, e, 'add', this.state)}
          backgroundColor={'transparent'}
          color={this.props.colors.primary1Color}
        >

        </Button>
        <View style={{ marginHorizontal: 10 }}>
          <Text></Text>
        </View>
        {
          newstate && newstate.length > 0 ?
          <>

         
         

                        <ListCard
              listcomponent={this.props}
              newstate={newstate}
              ourcomponent={mycomp}
              parentKey={key1}
              action={this.handler}
            />
                

</>


            : null
        }
      </View>
    );
  }
}
const styles = StyleSheet.create({

  wrapper: {
    paddingTop: 50,
    flex: 1
  },

  modal: {
    justifyContent: 'center',
    alignItems: 'center'
  },

  modal2: {
    height: 230,
    backgroundColor: "#3B5998"
  },

  modal3: {
    height: 300,
    width: 300
  },

  modal4: {
    height: 300
  },

  btn: {
    margin: 10,
    backgroundColor: "#3B5998",
    color: "white",
    padding: 10
  },

  btnModal: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 50,
    height: 50,
    backgroundColor: "transparent"
  },

  text: {
    color: "black",
    fontSize: 22
  }

});
