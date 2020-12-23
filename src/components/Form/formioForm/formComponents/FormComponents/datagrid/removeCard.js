import React from 'react'
import { useDispatch } from 'react-redux'
import { View} from 'react-native';
import { Icon } from 'react-native-elements';

export const CounterComponent = (props) => {
  const dispatch = useDispatch();
  return (
    <View>
      <Icon
        raised
        name='close'
        type='font-awesome'
        color='#f50'
        onPress={(event) => dispatch({ type: 'remove_card', payload: props.toremove })} />

    </View>
  )
}
export default CounterComponent;
