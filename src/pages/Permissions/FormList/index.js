import React from 'react';
import { ActivityIndicator, ScrollView, View, StyleSheet, Text, Alert,TouchableOpacity } from 'react-native';
import globalStyles from '../../globalStyles';
import GroupedFormsList from '../../components/GroupedFormsList';
class FormsList extends React.PureComponent {
  state = {
    loading: true,
    currentFormSelection: '',
    currentForm: '',
    currentFormDocumentId: null,
    currentFormName: null,
    isformPress: false,
    payload: null
  };
componentDidMount = async () => {
    this.setState({
      loading: false
    })
  };


  onFormPressed = async () => {

  }
  render() {
    const { loading } = this.state;
    const {
      addSingleSubmission
    } = this.props;
    if (loading) {
      return (
        <View style={globalStyles.loaderScreenCentered}>
          <ActivityIndicator size="large" />
        </View>
      );
    }

    return (
      <ScrollView>
      <View style={[globalStyles.screenContainerAction, { backgroundColor: '#f4f4f4' }]}>
          <GroupedFormsList
            handleFormsListItemPress={async (payload) => {
              this.setState({
                payload,
               // currentFormName: payload.name,
               // currentFormDocumentId: payload.doc.id

              },
 
              
              )

            }

            }
          />

        
        </View>



      </ScrollView>
    );
  }
}




export default FormsList;
