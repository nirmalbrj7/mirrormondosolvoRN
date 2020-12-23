import React,{Component} from 'react';
import { connect } from 'react-redux';
import { ActivityIndicator, Pressable, ScrollView, View, StyleSheet, Text,TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';
import globalStyles from '../../globalStyles';
import StoreActionsForm from '../../store/actions/form';
import StoreActionsSubmission from '../../store/actions/submission';
import StoreActionsSingleSubmissions from '../../store/actions/singlesubmission';



import GroupedFormsList from '../../components/GroupedFormsList/FormsGroup';
import GetLocation from 'react-native-get-location'

import Animated from 'react-native-reanimated';
import BottomSheet from 'reanimated-bottom-sheet';
import { Button as PaperButton, Divider, Title,Card } from 'react-native-paper';
import { Icon } from 'react-native-elements'


var fall = new Animated.Value(1)
const bs = React.createRef()

class Actions extends Component {
  
  state = {
    loading: null,
    currentFormSelection: '',
    currentForm: '',
    currentFormDocumentId: null,
    currentFormName: null,
    isformPress: false,
    payload: null
  };

  renderInner2 = () => (
    <View style={styles2.panel}>
      <View style={{alignItems: 'center'}}>
        <Text style={styles2.panelTitle}>{this.state.currentFormName}</Text>
        <Text style={styles2.panelSubtitle}>Choose Your Options</Text>
      </View>




      
      <TouchableOpacity style={styles2.panelButton}
      onPress={async () => { await this.onFormPressed() }}
       
       >
        <Text style={styles2.panelButtonTitle}>Fill Up the Form</Text>
      </TouchableOpacity>





      <TouchableOpacity style={styles2.panelButton} 
          onPress={() => {
            this.setState({
              currentFormSelection: ''
            }),
              bs.current.snapTo(1),

              this.props.navigation.navigate('SubmissionsSingle', { id: this.state.currentFormDocumentId })
          }}
      >
        <Text style={styles2.panelButtonTitle}>Go to Submissions</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles2.panelButton}
        onPress={() => {
          this.setState({
            currentFormSelection: ''
          }), bs.current.snapTo(1)
        }}>
        <Text style={styles2.panelButtonTitle}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );

  renderInner = () => {
    return (
    <View style={styles2.panel}>
      <Title>Choose Options:</Title>
      <Divider />
      <Text style={styles2.innerFormTitle}>{this.state.currentFormName}</Text>
      <View style={styles2.innerIconWrapper}>
        <View>
          <Pressable onPress={async () => { await this.onFormPressed() }}>
            {({ pressed }) => (
              <Icon
                reverse
                name='form'
                type='antdesign'
                color={pressed ? 'red' : '#6200ee'}
                size={32}
                onPress={async () => { await this.onFormPressed() }}
              />
            )}

          </Pressable>


          <Text style={styles2.centerText}>Fill the Form</Text>
         
        </View>
        <Pressable
          onPress={() => {
            this.setState({
              currentFormSelection: ''
            }),
              bs.current.snapTo(1),

              this.props.navigation.navigate('SubmissionsSingle', { id: this.state.currentFormDocumentId })
          }}>
          {({ pressed }) => (
            <>
              <Icon
                reverse
                name='profile'
                type='antdesign'
                color={pressed ? 'red' : '#6200ee'}
                size={32}

              />
              <Text>Go to Submissions</Text>
            </>
          )}
        </Pressable>
      </View>
      <Divider />
<View style={{flex:1,justifyContent:'center'}}>

<PaperButton icon="closecircleo" mode="outlined"


onPress={() => {
  this.setState({
    currentFormSelection: ''
  }), bs.current.snapTo(1)
}}>
Close
</PaperButton>


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
componentDidUpdate=async()=>{
  const {
    initializeSubmission2
  } = this.props;
  await initializeSubmission2();
}

  componentDidMount = async () => {
    
    const {
      initializeSubmission2
    } = this.props;
    await initializeSubmission2();
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
    await tryUpdateCurrentForm({ form, formEndpoint });
    await setCurrentFormData(payload.name, payload.doc.id, datagrid, slug);
    await initializeSubmission(null, latitude, longitude);
  };
  onFormPressed = async () => {
    bs.current.snapTo(1);
    await this.props.navigation.navigate('FormViewForm', {
      payload: this.state.payload,
      formName: this.state.currentFormName
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
      <>
        <ScrollView>
          <View style={[globalStyles.screenContainerAction, { backgroundColor: '#f4f4f4' }]}>

          <GroupedFormsList
            key={Math.random()}
            handleFormsListItemPress={async (payload) => {
              this.setState({
                payload,
                currentFormName: payload.name,
                currentFormDocumentId: payload.doc.id

              },
                bs.current.snapTo(0),
              )

            }

            }
          />



          </View>



        </ScrollView>
        <BottomSheet
          ref={bs}
          snapPoints={[330,0]}
          renderContent={this.renderInner2}
          renderHeader={this.renderHeader}
          initialSnap={1}
          callbackNode={fall}
          enabledInnerScrolling={false}
          enabledGestureInteraction={false}
        />
      </>
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
    initializeSubmission2: StoreActionsSubmission.initializeSubmission2,
    addSingleSubmission: StoreActionsSingleSubmissions.addSingleSubmission




  },
)(Actions);
const IMAGE_SIZE = 200

const styles2 = StyleSheet.create({
  innerFormTitle: {
    textAlign: 'center', fontWeight: 'bold', marginVertical: 10
  },
  innerIconWrapper: {

    flexDirection: "row",
    justifyContent: "space-around"

  },
  centerText: {
    textAlign: 'center'
  },
  innerSpacing: {
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
    padding: 20,
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
    // borderTopLeftRadius: 20,
    // borderTopRightRadius: 20,
    // shadowColor: '#000000',
    // shadowOffset: {width: 0, height: 0},
    // shadowRadius: 5,
    // shadowOpacity: 0.4,
  },
  header: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#333333',
    shadowOffset: {width: -1, height: -3},
    shadowRadius: 2,
    shadowOpacity: 0.4,
    // elevation: 5,
    paddingTop: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
    padding: 13,
    borderRadius: 10,
    backgroundColor: '#FF6347',
    alignItems: 'center',
    marginVertical: 7,
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
