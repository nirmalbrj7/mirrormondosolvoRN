import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, Alert, FlatList } from 'react-native';
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
const DATA = [
  {
    id: 'bd7acbea-c1b1-46c2-aed5-3ad53abb28ba',
    title: 'First Item',
  },
  {
    id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f63',
    title: 'Second Item',
  },
  {
    id: '58694a0f-3da1-471f-bd96-145571e29d72',
    title: 'Third Item',
  },
];

class FormView extends React.Component {
  constructor(props, navigation, route) {
    super(props);
    const params = this.props.route.params;
    // console.log("lat111"+params.latitude);
    this.state = {
      loading: false,
      payload: params.payload,
      formName: params.formName,
      latitude: null,
      longitude: null
    };
    console.log("lat222" + params);

    // const insets = useSafeArea();
    //const inAppFormName = useSelector(state => state.form.inAppFormName);
    const inAppFormName = "Ddddd";
    this.props.navigation.setOptions({ headerTitle: this.state.formName });
  }

  componentDidMount = async () => {
    await this.getGeolocation();
  }
  getGeolocation = async () => {
    GetLocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 15000,
    })
      .then(async location => {
        console.log(location);
        if (location.latitude) {
          this.setState({
            latitude: location.latitude,
            longitude: location.longitude,
          },
            await this.handleFormsListItemPress()

          )
        }
      })
      .catch(error => {
        const { code, message } = error;
        console.warn(code, message);
      })
  }

  handleFormsListItemPress = async () => {
    console.log("lat2" + this.state.latitude);
    const { form, formEndpoint, datagrid, slug } = this.state.payload.doc.data();
    console.log("formenfpoint" + formEndpoint);
    const {
      tryUpdateCurrentForm,
      setCurrentFormData,
      initializeSubmission,
    } = this.props;

    tryUpdateCurrentForm({ form, formEndpoint });
    setCurrentFormData(this.state.payload.name, this.state.payload.doc.id, datagrid, slug);
    initializeSubmission(null, this.state.latitude, this.state.longitude);
    //setLoading(true);
    this.setState({
      loading: true
    })
  };


   
   
   
     renderItem = ({ item }) => (
   
        <Card style={{ marginHorizontal: 2, marginVertical: 10,padding:0 }}>

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
    

  render() {
    const loading = this.state.loading;
    if (loading == false)
      return (
        <FlatList
        data={[1,2,3,4,5,6,7,8,9]}
        renderItem={this.renderItem}
        keyExtractor={item => item.id}
      />
   

      );
    return (
      <ScrollView>
        <View
          style={{
            ...globalStyles.screenContainer,
            paddingBottom: 20,
          }}>

          <FormFlowWizard />
        </View>
      </ScrollView>

    );
  }

}




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
