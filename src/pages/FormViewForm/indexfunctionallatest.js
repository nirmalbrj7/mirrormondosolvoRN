import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, FlatList } from 'react-native';
import { useSafeArea } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import globalStyles from '../../globalStyles';
import FormFlowWizard from '../../components/Form';
import { connect } from 'react-redux';

import StoreActionsForm from '../../store/actions/form';
import StoreActionsSubmission from '../../store/actions/submission';
import GetLocation from 'react-native-get-location'

import {
  Placeholder,
  PlaceholderMedia,
  PlaceholderLine,
  Fade,
  Loader,
  Shine,
  ShineOverlay,
} from 'rn-placeholder';
import { Card, } from 'react-native-paper';
const FormView = (props, navigation, route) => {
  const insets = useSafeArea();
  const inAppFormName = useSelector(state => state.form.inAppFormName);
  props.navigation.setOptions({ headerTitle: inAppFormName });
  const params = props.route.params;
  const payload = params.payload;
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    (async () => {
      await getGeolocation();
    })();
  }, []);
  const getGeolocation = async () => {
    GetLocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 15000,
    })
      .then(async location => {
        console.log(location);
        //setLatitude(location.latitude);
        //setLongitude(location.longitude);
        await handleFormsListItemPress(location);
      })
      .catch(error => {
        const { code, message } = error;
        console.warn(code, message);
      })
  }

  const handleFormsListItemPress = async (location) => {

    const { form, formEndpoint, datagrid, slug } = payload.doc.data();
    // console.log("formenfpoint"+formEndpoint);
    const {
      tryUpdateCurrentForm,
      setCurrentFormData,
      initializeSubmission,
    } = props;
    //alert("latitude",JSON.stringify(location));
   initializeSubmission(null, location.latitude, location.longitude);
    tryUpdateCurrentForm({ form, formEndpoint });
    setCurrentFormData(payload.name, payload.doc.id, datagrid, slug);

    setLoading(false);
  };
  const renderItem = ({ item }) => (

    <Card style={{ marginHorizontal: 2, marginVertical: 10, padding: 0 }}>

      <Card.Content>
        <Placeholder
          Animation={(props) => (
            <Loader {...props}
              size="large"
              color="purple" />
          )}>

          <PlaceholderLine width={60} height={20} />
          <PlaceholderLine width={100} height={40} />



        </Placeholder>
      </Card.Content>

    </Card>
  );
  /*if (loading == true)
    return (
      <FlatList
        data={[1, 2, 3, 4, 5, 6, 7, 8, 9]}
        renderItem={renderItem}
        keyExtractor={item => item.id}
      />

    );
*/
    if (loading == true)
    return(<Text>LOading</Text>);
  return (
    <ScrollView>
      <View
        style={{
          ...globalStyles.screenContainer,
          paddingBottom: insets.bottom,
        }}>
        <FormFlowWizard />
      </View>
    </ScrollView>

  );
};

FormView.propTypes = {
  inAppFormName: PropTypes.string,
  navigation: PropTypes.shape({}).isRequired,
};

FormView.defaultProps = {
  inAppFormName: '',
};

const ConnectedFormView = connect(
  null,
  {
    setCurrentFormData: StoreActionsForm.setCurrentFormData,
    tryUpdateCurrentForm: StoreActionsForm.tryUpdateCurrentForm,
    initializeSubmission: StoreActionsSubmission.initializeSubmission,
  },
)(FormView);

export default ConnectedFormView;
