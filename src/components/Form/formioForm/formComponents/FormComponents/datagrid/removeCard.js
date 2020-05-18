import React,{useEffect} from 'react'
import { useDispatch } from 'react-redux'
import {View,Text,FlatList,StyleSheet, Alert} from 'react-native';
import { Avatar, Card, Title, Paragraph, IconButton,Button } from 'react-native-paper';
import {Icon} from 'react-native-elements';

export const CounterComponent = (props) => {
    const dispatch = useDispatch();
    const toremove=props.toremove;

 


  return (
    <View>
        <Icon
  raised
  name='close'
  type='font-awesome'
  color='#f50'
  onPress={(event) => dispatch({ type: 'remove_card',payload:props.toremove}) } />

    </View>
  )
}
export default CounterComponent ;

