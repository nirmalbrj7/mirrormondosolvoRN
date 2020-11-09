import React,{useEffect} from 'react';
import { SafeAreaView, View, FlatList, StyleSheet, Text, Image, Alert } from 'react-native';
import { Avatar, Card, Title, Paragraph, IconButton } from 'react-native-paper';
import { TouchableOpacity } from 'react-native-gesture-handler';

import {useSelector,useDispatch} from 'react-redux';

import MultiComponent from "../sharedComponents/Multi";
import { FormioComponents } from './../../../factories/FormioComponents';
import InitData from './initData';
import ListCard from './listCard';
import ClearData from './clearData';
import AddCard from './addCard';
import Myglobal from '../../../../global';

import { Button,Icon } from 'react-native-elements/src/index';


class Datagrid extends MultiComponent {
  constructor(props) {
    super(props);
    this.state = {
    };
    this.onConfirm=this.onConfirm.bind(this);
    this.handler = this.handler.bind(this);
  }


handler = e => {
 // console.log("AAYO"+e);
  //alert('aayo'+e);
  const newstate=this.state.value.item;
  //console.log('new state'+JSON.stringify(newstate));
  const filterout=newstate.filter((post)=> e !== post.id);
  //console.log('filterout'+JSON.stringify(filterout));
  this.setValue(filterout);
};


  onConfirm(mycomp, index,param,currentState) {
 
    let  prevData=currentState.value;
   
    let  prevDatArray=prevData.item;

      if(prevDatArray==undefined){
              var myarray=[];
      var myobj={};
  
  
      mycomp.map((value,index)=>{
        myobj.id=Math.random();
        myobj[value.key]='';
       
      });
      myarray.push(myobj)
      
      this.setValue(myarray, index);
      }
else{
  const key = this.props.component.key;
  const data=this.props.data;
  const newstate=this.state;
  var myobj={};

  mycomp.map((value,index)=>{
      
    myobj.id=Math.random();
    myobj[value.key]='';
   
  });
  prevDatArray.push(myobj);
 // mycomp.push(mycomp[0]);
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

  

  render() {
    const {
        component, name, readOnly, colors, theme,value
      } = this.props;
      const label=component.label;
      //const fieldValue = typeof value === 'object' ? value.item : value;
      //index = index || 0;
      const mycomp = component.components;
      const key=component.key;
      const key1 = this.props.component.key;
      const data1=this.props.data;
      const newstate=this.state;
      //if(!data[key]){
    return (
      <View >
  
        <Text style={{
             flex: 1,
             marginTop: 20,
             marginHorizontal: 0,
             padding: 10,
             borderWidth: 0,
             fontSize: 16,
             lineHeight: 16,
        }}>{label}</Text>


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
            marginTop:  10,
            marginHorizontal: 0,
            paddingHorizontal: 0,
            alignSelf:'center',
            borderRadius:6
          }}
          onPress={(e)=>this.onConfirm(mycomp,e,'add',this.state)}
          backgroundColor={'transparent'}
          color={this.props.colors.primary1Color}
        >

          </Button>




      
      {
        /**
         *  <Button title="AddCard"
               
               style={{width:250,alignContent:'center',alignItems:'center',marginLeft:'15%'}}
               mode="contained" onPress={(e)=>this.onConfirm(mycomp,e,'add',this.state)}>AddCard</Button>
     
         * 
         */
      }
                 <ListCard listcomponent={this.props} newstate={newstate} ourcomponent={mycomp} parentKey={key1} action={this.handler}/>

      </View>
    );
  }
}

export default Datagrid;
const styles = StyleSheet.create({
  
});
