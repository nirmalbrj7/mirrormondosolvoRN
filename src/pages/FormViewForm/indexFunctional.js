import React,{useEffect,useState} from 'react';
import { View, ScrollView,Text } from 'react-native';
import { useSafeArea } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import globalStyles from '../../globalStyles';
import FormFlowWizard from '../../components/Form';
import { connect } from 'react-redux';

import StoreActionsForm from '../../store/actions/form';
import StoreActionsSubmission from '../../store/actions/submission';
import GetLocation from 'react-native-get-location'


const FormView = (props, navigation,route) => {
  const insets = useSafeArea();
  const inAppFormName = useSelector(state => state.form.inAppFormName);
  props.navigation.setOptions({ headerTitle: inAppFormName });
  const params=props.route.params;
  const payload=params.payload;
  const latitude=params.latitude;
  const longitude=params.longitude;
  const [loading, setLoading] = useState(false);
useEffect(async()=>{
await handleFormsListItemPress();
},[payload])
getGeolocation = async () => {
  GetLocation.getCurrentPosition({
    enableHighAccuracy: true,
    timeout: 15000,
  })
    .then(location => {
      console.log(location);
      return location;
    })
    .catch(error => {
      const { code, message } = error;
      console.warn(code, message);
    })
}

  handleFormsListItemPress = async () => {

    const { form, formEndpoint, datagrid, slug } = payload.doc.data();
    console.log("formenfpoint"+formEndpoint);
    const {
      tryUpdateCurrentForm,
      setCurrentFormData,
      initializeSubmission,
    } = props;

    tryUpdateCurrentForm({ form, formEndpoint });
    setCurrentFormData(payload.name, payload.doc.id, datagrid, slug);
    initializeSubmission(null, latitude, longitude);
    setLoading(true);
  };
if(loading==false)
  return (
    <ScrollView>
      <View
        style={{
          ...globalStyles.screenContainer,
          paddingBottom: insets.bottom,
        }}>
      <Text>dddd</Text>
      </View>
    </ScrollView>

  );
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
