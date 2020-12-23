import React,{useEffect} from 'react'
import { useDispatch } from 'react-redux'
import {View,Text,FlatList,StyleSheet, Alert} from 'react-native';
import { Avatar, Card, Title, Paragraph, IconButton,Button } from 'react-native-paper';


export const CounterComponent = (props) => {
    const dispatch = useDispatch();
    const listcomponent=props.listcomponent;
    const listvalue=props.listvalue;
    const listkey=props.listkey;
 
    const initdata={
        key:listkey,
        component:listcomponent,
        data:listvalue
    }
    useEffect(() => {
        dispatch({ type: 'init_data',payload:initdata});
      },[]);

  return (
    <View>
   <Button icon="idcard" mode="contained" style={{width:250,alignSelf:'center'}} onPress={(event) => dispatch({ type: 'add_card',payload:initdata}) }>
  CARD DATA
     </Button>
    </View>
  )
}
export default CounterComponent ;
const styles = StyleSheet.create({
  
});

