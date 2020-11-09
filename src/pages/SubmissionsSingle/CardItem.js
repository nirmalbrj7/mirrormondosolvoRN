import React, { useState, useEffect, useContext } from 'react';
import firestore from '@react-native-firebase/firestore';
import { connect } from 'react-redux';
import { useIsFocused } from "@react-navigation/native";
import { Text, View, FlatList, StyleSheet } from 'react-native';
import { Card, Button } from 'react-native-elements';
import { Chip, Title } from 'react-native-paper';
import { IconButton, Colors } from 'react-native-paper';
import Icons from 'react-native-vector-icons/AntDesign';
import IconsFontisto from 'react-native-vector-icons/Fontisto';
import IconsFeather from 'react-native-vector-icons/Feather';
import moment from 'moment';
import SingleSubmissionContext from '../../store/context/singlesubmission';
import StoreActionsForm from '../../store/actions/form';
import StoreActionsSubmission from '../../store/actions/submission';
function Todo({ id, title, complete }) {


  return (
    <List.Item
      title={title}
      onPress={() => toggleComplete()}
      left={props => (
        <List.Icon {...props} icon={complete ? 'check' : 'cancel'} />
      )}
    />
  );
}

export default React.memo(Todo);