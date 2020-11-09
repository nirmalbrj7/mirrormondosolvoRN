import React from 'react'
import { useDispatch } from 'react-redux'
import {View,Text,FlatList,StyleSheet} from 'react-native';
import { Avatar, Card, Title, Paragraph, IconButton,Button } from 'react-native-paper';


export const CounterComponent = (props) => {
    const dispatch = useDispatch();

    const newObj = [{
        id: 1,
        title: 'fouth ssitem'
      }];
      var myobj = []; 
      const {
        component, name, readOnly, colors, theme,
      } = props.mycomp;
     // const fieldValue = typeof value === 'object' ? value.item : value;
      //index = index || 0;
      const mycomp = props.mycomp;
      mycomp.map((component, index) => {
       console.log('compoent'+component.label);
       myobj.push({type:component.type,key:component.key,data:'',});
      });
  return (
    <View>


   <Button icon="idcard" mode="contained" style={{width:250,alignSelf:'center'}} onPress={(event) => dispatch({ type: 'add_card',payload:props.mycomp}) }>
     Add Card
     </Button>
    </View>
  )
}
export default CounterComponent ;

