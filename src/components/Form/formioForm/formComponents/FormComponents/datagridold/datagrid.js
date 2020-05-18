import React,{useEffect} from 'react';
import { SafeAreaView, View, FlatList, StyleSheet, Text, Image, Button, Alert } from 'react-native';
import { Avatar, Card, Title, Paragraph, IconButton } from 'react-native-paper';
import { TouchableOpacity } from 'react-native-gesture-handler';

import {useSelector,useDispatch} from 'react-redux';

import MultiComponent from "../sharedComponents/Multi";
//import styles from '../styles/InputSingleLine-styles';
import { FormioComponents } from './../../../factories/FormioComponents';
import ListCard from './listCard';
import AddCard from './addCard';
const addCard = ({ event }) => {
  const dispatch = useDispatch();
return true;
  /*const cardData=useSelector(state=>{
    console.log("STATE"+JSON.stringify(state.datagridreducer))
    return state.datagridreducer;
  });

  const ID = cardData.length + 1;
  const newObj = {
    id: ID,
    title: 'fouth item'
  };
  dispatch({type:'add_card',payload:newObj})*/
  /*this.setState({
    cardObject: this.state.cardObject.concat(newObj)
  });*/
 /* console.log(this.state.cardObject);
  this.setState({
    cardObject: 'WWWW',
  });*/
};


const FormView = () => {

  
  //const cardData = useSelector(state=>state.datagridreducer);
  const dispatch = useDispatch();
  const cardData = useSelector(state=>state.datagridreducer);
  return (
    <View>


<Text>SSS{JSON.stringify('ssss')}</Text>
<Button title="Add" onPress={(event) => dispatch({ type: 'add_card',payload:'aaaa' }) }/>
</View>
  )
}

const removeCard = (event, id) => {
  const dispatch = useDispatch();
  Alert.alert(
    "Are you sure",
    "Delete data",

    [
      {
        text: "Cancel",
        onPress: () => console.log("Cancel Pressed"),
        style: "cancel"
      },
      {
        text: "Yes",
        onPress: e => {
          const updatedCard = this.state.cardObject.filter(item => item.id !== id);
          this.setState({
            cardObject: updatedCard
          });
        }
      }
    ],
    { cancelable: false }
  );

};


export default class Datagrid extends MultiComponent {
  constructor(props) {
    super(props);
    /*this.state = {
      cardObject: []
    };*/
   // this.addCard = this.addCard.bind(this);
    this.onChangeText = this.onChangeText.bind(this);
    this.onConfirm=this.onConfirm.bind(this);
   // this.getSingleElement = this.getSingleElement.bind(this);
  }

  onConfirm(value, index) {
    var myarray=[];
    var myobj={};
    myobj.name='sakar';
    myobj.number='1111';
    myarray.push(myobj)
    myobj.name='aryal';
    myobj.number='1111';
    myarray.push(myobj)
    this.setValue(myarray, index);
  }






  onChangeText(index, value) {
var myarray=[];
    var myobj={};
    myobj.name='sakar';
    myobj.number='1111';
    myarray.push(myobj)
    myobj.name='aryal';
    myobj.number='1111';
    myarray.push(myobj)

    this.setValue(myarray, index);
  }

  render() {
    const {
      component, name, readOnly, colors, theme,
    } = this.props;
   // const fieldValue = typeof value === 'object' ? value.item : value;
    //index = index || 0;
    const mycomp = component.components;

    const cardObject=this.state.cardObject;

    var myobj = []; 


    mycomp.map((component, index) => {
      console.log('compoent'+component.label);
      myobj.push({type:component.type,key:component.key,data:'',});
     });


    return (
      <View style={styles.container}>
        <Text>{JSON.stringify(this.props)}</Text>
        <Button title="adding" onPress={this.onConfirm}/>
   <AddCard mycomp={mycomp}/>

     <ListCard newComp={this.props} mycomp={mycomp}/>
       </View>

      
  
    );




  }
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 5,
  },
  item: {
    backgroundColor: '#f9c2ff',
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 32,
  },
});
