import React from 'react';
import {
  Image, Text, TouchableHighlight, View,
} from 'react-native';
import PropTypes from 'prop-types';

import styles from './style';
import { Avatar, Button, Card, Title, Paragraph } from 'react-native-paper';
function FormsListItem(props) {
  const { onPress, form } = props;

const LeftContent = props => <Avatar.Icon {...props} icon="form" />
  return (
    <View >

<Card onPress={() => { onPress(form); }}>
    <Card.Title title={form.name}  left={LeftContent} />

  </Card>

{
  /**
   * 
   *     <TouchableHighlight
      onPress={() => { onPress(form); }}
      underlayColor="hsla(0, 0%, 0%, 0.25)"
    >
      <View style={styles.formsListItem}>
        <Text style={styles.formsListItemText}>{form.name}</Text>
        {form.Icon ? (
          <Image
            style={styles.formsListIcon}
            source={{ uri: form.Icon }}
          />
        ) : null}
      </View>
    </TouchableHighlight>
   */
}
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
