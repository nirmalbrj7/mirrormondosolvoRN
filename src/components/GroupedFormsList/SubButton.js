import * as React from 'react';
import { Text,View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button,Icon } from 'react-native-elements';
function GoToButton({ props,screenName,formId }) {
  const navigation = useNavigation();

  return (


    <View>

    <Icon
      reverse
      name='profile'
      type='antdesign'
      color='#6200ee'
      size={32}
      onPress={() => {
        
   
     //   navigation.navigate('SubmissionsSingle',{id:formId})
      
      }}
    />


  <Text style={{ textAlign: 'center' }}>{screenName}</Text>
  </View>
  );
}
export default GoToButton;