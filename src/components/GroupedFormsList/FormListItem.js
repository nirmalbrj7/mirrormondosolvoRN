import React from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';
import { Avatar, Card } from 'react-native-paper';
function FormsListItem(props) {
  const { onPress, form } = props;
  const LeftContent = props => <Avatar.Icon {...props} icon="form" />
  return (
    <View style={{ backgroundColor: '#F4F4F4' }}>
  
      <Card onPress={() => { onPress(form); }} style={{
        
      
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

FormsListItem.propTypes = {
  onPress: PropTypes.func.isRequired,
  form: PropTypes.shape({
    name: PropTypes.string.isRequired,
    Icon: PropTypes.string,
  }).isRequired,
};

export default FormsListItem;