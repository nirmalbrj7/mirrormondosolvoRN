import React from 'react'
import { useDispatch } from 'react-redux'
import {View,Text,Button,FlatList,StyleSheet} from 'react-native';
import {Icon} from 'react-native-elements';
import { Avatar, Card, Title, Paragraph, IconButton } from 'react-native-paper';

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

