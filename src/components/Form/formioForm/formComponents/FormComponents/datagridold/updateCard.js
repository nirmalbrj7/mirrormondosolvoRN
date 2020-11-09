import React from 'react'
import { useDispatch } from 'react-redux'
import {View,Text,Button,FlatList,StyleSheet} from 'react-native';
import { Avatar, Card, Title, Paragraph, IconButton } from 'react-native-paper';

export const CounterComponent = (props) => {
    const dispatch = useDispatch();

  
  return (
    <View>

   <Button title="Add Crad" onPress={(event) => dispatch({ type: 'update_card',payload:props.mycomp}) }/>
    </View>
  )
}
export default CounterComponent ;

