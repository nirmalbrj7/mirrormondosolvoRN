import React from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';
import { Avatar,Card } from 'react-native-paper';
function FormsListItem(props) {
  const { onPress, form } = props;
  const LeftContent = props => <Avatar.Icon {...props} icon="form" />
  return (
    <View >
      <Card onPress={() => { onPress(form); }}>
        <Card.Title title={form.name} left={LeftContent} />
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
