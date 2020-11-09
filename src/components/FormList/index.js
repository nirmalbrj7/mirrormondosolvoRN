import React from 'react';
import { Avatar, Card } from 'react-native-paper';
import { View, Text } from 'react-native';
import form from '../../store/reducers/form';
const FormList=()=>{
    const LeftContent = props => <Avatar.Icon {...props} icon="form" />
    return (
        <View style={{ backgroundColor: '#F4F4F4' }}>
      
          <Card 
          key={Math.random()}
          onPress={() => { 
              
            //  onPress(form); 
            }} style={{
            
          
            paddingVertical: 5,
            marginBottom: 15,
            marginHorizontal: 10,
            borderRadius: 10
          }}>
            <Card.Title title={form.name} left={LeftContent} titleStyle={{fontSize: 17, fontFamily: 'sans-serif-light',fontWeight:'bold' }} />
          </Card>
        </View>
    
      );

}
export  default FormList;