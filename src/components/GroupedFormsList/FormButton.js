import * as React from 'react';
import { Text,View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button,Icon } from 'react-native-elements';
function GoToButton({ screenName,handler }) {
  const navigation = useNavigation();

  return (


    <View>
    <Icon
      reverse
      name='profile'
      type='antdesign'
      color='#f50'
      size={32}
      onPress={() => {handler,navigation.navigate(screenName)}}
    />


  <Text style={{ textAlign: 'center' }}>{screenName}</Text>
  </View>
  );
}
export default GoToButton;