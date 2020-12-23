import React, { useEffect, useState, useCallback } from 'react';
import { Avatar, Card } from 'react-native-paper';
import { View, Text, ActivityIndicator, FlatList } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

import PropTypes from 'prop-types';
import commonStyles from '../../globalStyles';
import styles from './style';
import FormsListItem from './FormListItem';
import { FETCHABLE_DATA_STATUS } from '../../constants/values';
import { useSelector, useDispatch } from 'react-redux'

const FormList = (props) => {
  const orgSlug = useSelector(state => {
    //console.log("STATE" + JSON.stringify(state.datagridreducer))
    return state.userreducer.organization;
  });
  const [isLoading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const currentUid = auth().currentUser.uid;
  const formRef = firestore().collection(`forms_${orgSlug}`).where('userIds', 'array-contains', currentUid);
  const LeftContent = props => <Avatar.Icon {...props} icon="form" />

  const [forms, setForms] = useState([]);
  const [status, setStatus] = useState(FETCHABLE_DATA_STATUS.LOADING);


  useEffect(() => {
    const unsubscribe = formRef.onSnapshot(querySnapshot => {
      const form = [];

      querySnapshot.forEach(doc => {

        const { name, Icon, formEndpoint, form_link, slug, DateCreated } = doc.data();
        const formData = doc.data().form;
        const isLargeForm = doc.data().form == null ? 'true' : 'false';
        form.push({
          key: doc.id, // Document ID
          doc, // DocumentSnapshot
          name,
          Icon,
          formEndpoint,
          form_link,
          isLargeForm,
          slug,
          DateCreated,
          form: formData
        });

      });


      let status;
      if (!form.length) {
        status = FETCHABLE_DATA_STATUS.EMPTY;
      } else {
        status = FETCHABLE_DATA_STATUS.SUCCESS;
      }
      setStatus(status);
      setForms(form);

      /*return (() => {
        
        unsubscribe() 
     })*/
    });
    return () => unsubscribe();

  }, []);



  const getGroupContent = status => {

    //const {forms} = this.state;
    const { handleFormsListItemPress } = props;
    const formsOrdered = forms.sort((a, b) => a.orderNo - b.orderNo);

    switch (status) {
      case FETCHABLE_DATA_STATUS.LOADING: {
        return <ActivityIndicator size="small" color="purple" />;
      }
      case FETCHABLE_DATA_STATUS.EMPTY: {
        return (
        <>
        <Text>orgSlug{orgSlug}</Text>
        <Text key={Math.random()}>No forms here</Text>
        </>
        );
      }
      case FETCHABLE_DATA_STATUS.SUCCESS: {
        return (
          <View style={styles.formsListContainer} key={Math.random()}>

            {formsOrdered.map(form => (
              <>
           
                <FormsListItem
                  key={form.key}
                  form={form}
                  onPress={handleFormsListItemPress}
                />

              </>
            ))}
          </View>
        );
      }
      default:
        return <View key={Math.random()}/>;
    }
  };


  return (
    <View style={styles.groupsListItemContainer} key={Math.random()}>


      {getGroupContent(status)}
    </View>
  );

}
export default FormList;