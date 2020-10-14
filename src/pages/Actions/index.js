import React from 'react';
import { connect } from 'react-redux';
import { ActivityIndicator, ScrollView, View, StyleSheet, Text, Alert,TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';
import globalStyles from '../../globalStyles';
import StoreActionsForm from '../../store/actions/form';
import StoreActionsSubmission from '../../store/actions/submission';
import StoreActionsSingleSubmissions from '../../store/actions/singlesubmission';
import GroupedFormsList from '../../components/GroupedFormsList';
import GetLocation from 'react-native-get-location'
import Animated from 'react-native-reanimated';
import BottomSheet from 'reanimated-bottom-sheet';
import { Button as PaperButton, Divider, Title } from 'react-native-paper';
import { Icon } from 'react-native-elements'
import SubmissionsButton from '../../components/GroupedFormsList/SubButton';
import { StackActions } from '@react-navigation/native';

var fall = new Animated.Value(1)
const bs = React.createRef()

class Actions extends React.PureComponent {
  state = {
    loading: true,
    currentFormSelection: '',
    currentForm: '',
    currentFormDocumentId: null,
    currentFormName: null,
    isformPress: false,
    payload: null
  };



  renderInner = () => {
    return (<View style={styles2.panel}>
      <Title>Choose Options:</Title>
      <Divider />
      <Text style={styles2.innerFormTitle}>{this.state.currentFormName}</Text>

      <View
        style={styles2.innerIconWrapper}
      >
        <View>
          <Icon
            reverse
            name='form'
            type='antdesign'
            color='#6200ee'
            size={32}
            onPress={async () => { await this.onFormPressed() }}

          />


          <Text style={styles2.centerText}>Form</Text>
    <Text style={styles2.centerText}>{this.state.currentFormName}</Text>
        </View>
        <TouchableOpacity
        onPress={()=>{
          this.setState({
            currentFormSelection: ''
          }),
          bs.current.snapTo(1),
        
          this.props.navigation.navigate('SubmissionsSingle',{id:this.state.currentFormDocumentId})
        }}>

        <SubmissionsButton screenName='Submissions' formId={this.state.currentFormDocumentId} />
     </TouchableOpacity>
      </View>
      <View style={styles2.innerSpacing}>
        <PaperButton icon="closecircleo" mode="outlined"


          onPress={() => {
            this.setState({
              currentFormSelection: ''
            }), bs.current.snapTo(1)
          }}>
          Close
  </PaperButton>

        <View style={styles2.innerSpacing} />
      </View>


    </View>
    )




  }

  renderHeader = () => <View style={styles2.header} />

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


  componentDidMount = async () => {
    this.setState({
      loading: false
    })
  };

  handleFormsListItemPress = async (payload, latitude, longitude) => {
    const {
      tryUpdateCurrentForm,
      setCurrentFormData,
      initializeSubmission,
    } = this.props;
    const { form, formEndpoint, datagrid, slug } = payload.doc.data();
    tryUpdateCurrentForm({ form, formEndpoint });
    setCurrentFormData(payload.name, payload.doc.id, datagrid, slug);
    initializeSubmission(null, latitude, longitude);
  };
  onFormPressed = async () => {
    bs.current.snapTo(1);
         await this.props.navigation.navigate('FormViewForm',{
           payload:this.state.payload,
           formName:this.state.currentFormName
           //latitude:location.latitude,
           //longitude:location.longitude
         });
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
                currentFormName: payload.name,
                currentFormDocumentId: payload.doc.id

              },
              console.log('aaa'+this.state.currentFormName),
              bs.current.snapTo(0),
           //   addSingleSubmission({ currentFormName: this.state.currentFormName, currentFormDocumentId:this.state.currentFormDocumentId})

              
              
              )

            }

            }
          />

          <BottomSheet
            ref={bs}
            snapPoints={[300, 0, 300, 500]}
            renderContent={this.renderInner}
            renderHeader={this.renderHeader}
            initialSnap={1}
            callbackNode={fall}
            enabledInnerScrolling={false}
            enabledGestureInteraction={false}
          />

        </View>



      </ScrollView>
    );
  }
}

Actions.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
  tryUpdateCurrentForm: PropTypes.func.isRequired,
  setCurrentFormData: PropTypes.func.isRequired,
  initializeSubmission: PropTypes.func.isRequired,
};

const ConnectedActions = connect(
  null,
  {
    setCurrentFormData: StoreActionsForm.setCurrentFormData,
    tryUpdateCurrentForm: StoreActionsForm.tryUpdateCurrentForm,
    initializeSubmission: StoreActionsSubmission.initializeSubmission,
    addSingleSubmission: StoreActionsSingleSubmissions.addSingleSubmission




  },
)(Actions);
const IMAGE_SIZE = 200

const styles2 = StyleSheet.create({
  innerFormTitle:{
    textAlign: 'center', fontWeight: 'bold', marginVertical: 10
    },
    innerIconWrapper:{
    
        flexDirection: "row",
        justifyContent: "space-around"
      
    },
    centerText:{
       textAlign: 'center' 
    },
    innerSpacing:{
     marginVertical: 20 
    },
  container: {
    flex: 1,
    backgroundColor: '#f1f2f3',
  },
  box: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
  },
  panelContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  panel: {
    // zIndex:999999999999999,
    width: '112%',
    //  height: 600,
    paddingHorizontal: 10,
    paddingVertical: 20,

    backgroundColor: '#fff',
    paddingTop: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 5,
    shadowOpacity: 0.6,

    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#fff',
    //s  marginLeft: -20,
    //marginLeft:10,
    // marginRight: -20,
    // marginTop:-200,a
    // marginBottom:-200
  },
  header: {
    // width: '100%',
    height: 100,

    //zIndex:999999999999999,
    // backgroundColor:'red'
  },
  panelHeader: {
    alignItems: 'center',
  },
  panelHandle: {
    width: 40,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00000040',
    marginBottom: 10,
  },
  panelTitle: {
    fontSize: 27,
    height: 35,
  },
  panelSubtitle: {
    fontSize: 14,
    color: 'gray',
    height: 30,
    marginBottom: 10,
  },
  panelButton: {
    padding: 15,
    borderRadius: 10,
    // backgroundColor: '#292929',
    alignItems: 'center',
    marginVertical: 10,
    minWidth: 100
  },
  panelButtonTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: 'white',
  },
  photo: {
    width: '100%',
    height: 225,
    marginTop: 30,
  },
  map: {
    height: '100%',
    width: '100%',
  },
})

export default ConnectedActions;
