


import React from 'react';
import { View, ToastAndroid, ActivityIndicator, ScrollView, Alert, Button as ButtonRN, FlatList, Text, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import firestore from '@react-native-firebase/firestore';

import auth from '@react-native-firebase/auth';
import moment from 'moment';
import { Dropdown } from 'react-native-material-dropdown';
import Animated from 'react-native-reanimated';
import BottomSheet from 'reanimated-bottom-sheet';

import { Card, ListItem, Button, Icon, SearchBar, Divider, CheckBox } from 'react-native-elements';
import Icons from 'react-native-vector-icons/AntDesign';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import styles from '../../components/Profile/style';
import globalStyles from '../../globalStyles';
import StoreActionsForm from '../../store/actions/form';
import StoreActionsSubmission from '../../store/actions/submission';

class Submissions extends React.Component {
  constructor(props, navigation, route) {
    super(props);
    this.state = {
      submissions: [],
      filterType: props.route.name,
      isFetching: false,
      ArrayData: [],
      currentSelected: null,
      currentSelectedFormId: null,

      forms: [{ label: 'All Form', value: 'all' }],

      dateSorting: false,
      formSorting: false,

      currentDateType: true,//for descending
      currentFormType: null,//true for descending false for assending
      currentFormName: 'all',
      value:''
    };
    this.arrayholder = [];
    this.onChangeSelect = this.onChangeSelect.bind(this);
  }

  async componentDidMount() {
    await this.getData();
  }
  getData = async () => {

    const currentUid = auth().currentUser.uid;
    this.setState({
      submissions: []
    });
  
    await firestore()
      .collection('forms')
      .where('userIds', 'array-contains', currentUid)
      .get()
      .then(querySnapshot => {
        //console.log('Total users: ', querySnapshot.size);

        querySnapshot.forEach(async documentSnapshot => {
          //r  console.log('User ID: ', documentSnapshot.id, documentSnapshot.data().name);
          this.setState({
            forms: [...this.state.forms, { 'value': documentSnapshot.data().name }],
          })

          var slugId = documentSnapshot.id;
          var formData = documentSnapshot.data();
          const querySnapshot = await firestore().collection('submissions')
            .doc(slugId)
            .collection('submissionData')
            .get()
            .then(querySnapshot => {
              console.log('Total users: ', querySnapshot.size);
              //this.onCollectionUpdate(querySnapshot);
              querySnapshot.forEach(async documentSnapshot => {

                var submission = documentSnapshot.data();
                if (slugId == submission.formId) {
                //  console.log("formDta" + JSON.stringify(formData.name));
                  submission["formName"] = formData.name;
                  submission["form"] = formData;
                  submission["slug"] = slugId;
                  submission["submissionId"] = documentSnapshot.id;
                  this.setState({
                    submissions: [...this.state.submissions, submission],

                  },
                    //r   console.log(JSON.stringify(this.state.submissions))

                  )
                  this.arrayholder = this.state.submissions;

                }

              });





            });




        });
      });



    /*s    const querySnapshot = await firestore()
          .collection('submissions')
          .get();
    
    
        querySnapshot.forEach(async (documentSnapshot) => {
          if (documentSnapshot.exists == true) {
            const slug = documentSnapshot.id;
            const querySnapshot = await firestore().collection('submissions')
              .doc(slug)
              .collection('submissionData')
              .get()
              .then(querySnapshot => {
                console.log('Total users: ', querySnapshot.size);
                this.onCollectionUpdate(querySnapshot);
              });
          }
        });*/
  }



  onRefresh() {
    this.setState({ isFetching: true, }, () => { this.getData(); });
  }



  makeSubmissionActionButton = data => {
    const {
      navigation,
      tryUpdateCurrentForm,
      setCurrentFormData,
      updateFirebaseSubmissionId,
      fetchSubmissionDataFromCloud,
    } = this.props;
    let buttonTitle;
    switch (data.status) {
      case 'Incomplete':
        buttonTitle = 'Continue';
        break;
      case 'Submitted':
        buttonTitle = 'View';
        break;
      case 'Ready':
        buttonTitle = 'Submit';
        break;
      case 'Uploading':
        buttonTitle = 'Uploading...';
        break;
      case 'Synced':
        buttonTitle = 'View';
        break;
      default:
        buttonTitle = 'No action';
    }

    let onPressCallback;
    let isButtonActive = true;
    switch (data.status) {
      case 'Incomplete':
        onPressCallback = () => {
          navigation.navigate('FormView');

          tryUpdateCurrentForm({
            form: data.form.form,
            formEndpoint: data.form.formEndpoint,
          });
          setCurrentFormData(data.form.name, data.formId, data.datagrid, data.slug);
          updateFirebaseSubmissionId(data.submissionId);
          fetchSubmissionDataFromCloud(data.submissionId, data.slug);
        };
        break;
      case 'Submitted':
        onPressCallback = () => {
          navigation.navigate('View', { submissionId: data.submissionId, slug: data.slug });
        };
        break;
      case 'Synced':
        onPressCallback = () => {
          navigation.navigate('View', { submissionId: data.submissionId, slug: data.slug });
        };
        break;
      case 'Ready':
        onPressCallback = () => {
          navigation.navigate('FormView');
          tryUpdateCurrentForm({
            form: data.form.form,
            formEndpoint: data.form.formEndpoint,
          });
          setCurrentFormData(data.form.name, data.formId, data.datagrid, data.slug);
          updateFirebaseSubmissionId(data.submissionId);
          fetchSubmissionDataFromCloud(data.submissionId, data.slug);
        };
        break;
      case 'Submitted':
        onPressCallback = () => { };
        break;
      default:
        isButtonActive = false;
    }

    return (
      <Button
        title="Continue"
        type="clear"
        onPress={onPressCallback}
        buttonStyle={{ backgroundColor: 'transparent', fontSize: 20, color: 'green' }}

      //backgroundColor="red"
      />

    );
  };
  deleteFromFirebase = (formId, submissionId) => {
    firestore()
      .collection('submissions')
      .doc(formId)
      .collection('submissionData')
      .doc(submissionId)
      .delete()
      .then(() => {
        console.log(' firestore deleted!');
        this.bs.current.snapTo(1);
        this.setState({
          currentSelected: null
        })
        ToastAndroid.showWithGravityAndOffset(
          'Submission has been deleted.You can pull to refresh to see changes',
          ToastAndroid.LONG,
          ToastAndroid.BOTTOM,
          25,
          50
        );
        console.log(' fheree!');
        firestore()
          .collection('media')
          .get()
          .then(querySnapshot => {
            //console.log('Total users: ', querySnapshot.size);

            querySnapshot.forEach(async documentSnapshot => {
              var data = documentSnapshot.data();
              console.log('1'+data.submissionId);
              console.log('2'+submissionId);
              if (data.submissionId == submissionId) {
                console.log('3match'+submissionId);
        firestore()
        .collection('media').doc(documentSnapshot.id).
                  delete()
                  .then(() => {
                    console.log(' media deleted!');
                  });
              }

            });
          });


        /*if(item==true){
          //alert('aaa'+JSON.stringify(this.state.value.item));
         let filteredArray =  this.state.value.item.filter(item => item.id != id);
         //alert('filteredArray'+JSON.stringify(this.state.value));
         console.log('filteredArray'+JSON.stringify(filteredArray));
         this.setValue(filteredArray);
        }
        else if(item==false){
         //alert('sss'+JSON.stringify(this.state.value.item));
         let filteredArray =  this.state.value.item.filter(item => item.id != id)
         //alert('filteredArray'+JSON.stringify(this.state.value));
         console.log('filteredArray'+JSON.stringify(filteredArray));
         this.setValue(filteredArray);
        }
        else{
  
        }*/
      });
  }
  deleteSubmission = (formId, submissionId) => {

    this.deleteFromFirebase(formId, submissionId)
  }

  renderInner = () => (

    <View style={styles2.panel}>


      <Text style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 20, color: '#000s' }}>Delete</Text>





      <Text>Do you want to delete this submission having Id
  <Text style={{ fontWeight: 'bold' }}>{" "}{this.state.currentSelected}</Text></Text>
      <Text><Text style={{ fontWeight: 'bold' }}>Disclaimer:</Text>After deleting data its associated media data will also will be deleted</Text>
      <TouchableOpacity onPress={() =>

        this.deleteSubmission(this.state.currentSelectedFormId, this.state.currentSelected)



      }>
        <View style={[styles2.panelButton, { backgroundColor: 'red' }]}>
          <Text style={[styles2.panelButtonTitle]}>Confirm Delete</Text>
        </View>

      </TouchableOpacity>
      <TouchableOpacity onPress={() => {
        this.bs.current.snapTo(1)

        this.setState({
          currentSelected: null
        })
      }
      }>
        <View style={[styles2.panelButton, { backgroundColor: 'green' }]}>
          <Text style={[styles2.panelButtonTitle]}>Close</Text>
        </View>

      </TouchableOpacity>
    </View>


  )

  renderHeader = () => <View style={styles.header} />

  ApplyFilterDescending=()=>{
    console.log("from descending");
        const { dateSorting, formSorting, currentFormName, submissions } = this.state;
    const newData = this.arrayholder.filter(item => {
      if (item.form) {
        if (item.status == this.state.filterType) {
         
            this.arrayholder.sort((a, b) => {

              if (a.form && b.form) {
                if (a.status == this.state.filterType) {
                  console.log('a.form.name < b.form.name' + a.form.name + b.form.name + a.form.name < b.form.name);
                  if (a.form.name < b.form.name) { return -1; }
                  if (a.form.name > b.form.name) { return 1; }
                  return 0;
                }
              }

            })
              .map((item2, i) => {

                if (item2.form) {
                  if (item2.status == this.state.filterType) {
                    console.log('sort' + JSON.stringify(item2.form.name));
                    return item2;
                  }
                }

              });



            return item;
          




        }
      }


    });
    this.setState({
      submissions: newData,
    });
  }
  ApplyFilterAscending=()=>{
    console.log("from ascending");
        const { dateSorting, formSorting, currentFormName, submissions } = this.state;
    const newData = this.arrayholder.filter(item => {
      if (item.form) {
        if (item.status == this.state.filterType) {
         
            this.arrayholder.sort((a, b) => {

              if (a.form && b.form) {
                if (a.status == this.state.filterType) {
                  console.log('a.form.name < b.form.name' + a.form.name + b.form.name + a.form.name < b.form.name);
                  if (a.form.name > b.form.name) { return -1; }
                  if (a.form.name < b.form.name) { return 1; }
                  return 0;
                }
              }

            })
              .map((item2, i) => {

                if (item2.form) {
                  if (item2.status == this.state.filterType) {
                    console.log('sort' + JSON.stringify(item2.form.name));
                    return item2;
                  }
                }

              });



            return item;
          




        }
      }


    });
    this.setState({
      submissions: newData,
    });
  }

  ApplyFilter = () => {

    const { dateSorting, formSorting, currentFormName, submissions } = this.state;
    const newData = this.arrayholder.filter(item => {
      if (item.form) {
        if (item.status == this.state.filterType) {
          if (currentFormName == 'all') {
            this.arrayholder.sort((a, b) => {

              if (a.form && b.form) {
                if (a.status == this.state.filterType) {
                  console.log('a.form.name < b.form.name' + a.form.name + b.form.name + a.form.name < b.form.name);
                  if (a.form.name > b.form.name) { return -1; }
                  if (a.form.name < b.form.name) { return 1; }
                  return 0;
                }
              }

            })
              .map((item2, i) => {

                if (item2.form) {
                  if (item2.status == this.state.filterType) {
                    console.log('sort' + JSON.stringify(item2.form.name));
                    return item2;
                  }
                }

              });



            return item;
          }
          else {
            if (currentFormName == item.form.name) {


              if (formSorting == true) {


                this.arrayholder.sort((a, b) => {

                  if (a.form && b.form) {
                    if (a.status == this.state.filterType) {
                      if (a.form.name < b.form.name) { return -1; }
                      if (a.form.name > b.form.name) { return 1; }
                      return 0;
                    }
                  }

                })
                  .map((item2, i) => {

                    if (item2.form) {
                      if (item2.status == this.state.filterType) {
                        console.log('sort' + JSON.stringify(item2.form.name));
                        return item2;
                      }
                    }

                  });
              }
              else if (dateSorting == true) {



                this.arrayholder.sort((a, b) => {

                  if (a.form && b.form) {
                    if (a.status == this.state.filterType) {
                      if (b.timestamp._seconds < a.timestamp._seconds) { return -1; }
                      if (b.timestamp._seconds > a.timestamp._seconds) { return 1; }
                      return 0;
                    }
                  }

                })
                  .map((item2, i) => {

                    if (item2.form) {
                      if (item2.status == this.state.filterType) {

                        return item2;
                      }
                    }

                  });

              }
              else {

              }



              return item
            }
          }




        }
      }


    });
    this.setState({
      submissions: newData,
    });

  }

  onChangeSelect(selected) {
    this.setState({
      currentFormName: selected
    });

  }
  renderInnerFilter = () => (

    <View style={styles2.panel}>


      <Text style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 20, color: '#000s' }}>Filter</Text>
      <Text>Sort By</Text>

      <CheckBox containerStyle={{ backgroundColor: '#e0ebff' }}

        title='Date'
        checked={this.state.dateSorting}
        onPress={() => {
          this.setState({
            dateSorting: true,
            formSorting: false
          })
        }}
      />
      <CheckBox containerStyle={{ backgroundColor: '#e0ebff' }}

        title='Form Name'
        checked={this.state.formSorting}
        onPress={() => {
          this.setState({
            dateSorting: false,
            formSorting: true
          })
        }}
      />



      <Text>Select Form</Text>
      <Dropdown
        label='Forms'



        onChangeText={this.onChangeSelect}

        data={this.state.forms}
        value={this.state.currentFormName}

      // onPress={() => { }}
      />
      <View style={{
        flex: 1, flexDirection: 'row',
        justifyContent: 'space-around', marginTop: 20
      }}>
        <TouchableOpacity onPress={() =>

          this.ApplyFilter()



        }>


          <View style={[styles2.panelButton, { backgroundColor: 'red' }]}>
            <Text style={[styles2.panelButtonTitle]}>Apply</Text>
          </View>

        </TouchableOpacity>
        <TouchableOpacity onPress={() => this.bsFilter.current.snapTo(1)}>
          <View style={[styles2.panelButton, { backgroundColor: 'green' }]}>
            <Text style={[styles2.panelButtonTitle]}>Close</Text>
          </View>

        </TouchableOpacity>

      </View>


    </View>


  )

  renderHeaderFilter = () => <View style={styles.header} />
  searchFilterFunction = text => {
    this.setState({
      value: text,
    });
    // console.log("000000000000000" + JSON.stringify(this.arrayholder));
    const newData = this.arrayholder.filter(item => {
      if (item.form) {
        if (item.status == this.state.filterType) {

          // console.log("AAAAAAAAAAAAAA" + JSON.stringify(item));
          const itemData = `${item.formName.toUpperCase()} ${item.status.toUpperCase()}`;
          const textData = text.toUpperCase();
          //console.log("REt"+JSON.stringify( itemData.indexOf(textData) > -1));
          return itemData.indexOf(textData) > -1;
        }
      }


    });
    this.setState({
      submissions: newData,
    });
  };
  renderHeader2 = () => {
    return (
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <SearchBar
          style={{ flex: 1 }}
          placeholder="Type Here..."
          lightTheme
          round
          onChangeText={text => this.searchFilterFunction(text)}
          autoCorrect={false}
          value={this.state.value}

          inputStyle={{ backgroundColor: 'white' }}
          containerStyle={{ backgroundColor: 'white', borderWidth: 1, borderRadius: 5, width: '90%' }}
          placeholderTextColor={'#g5g5g5'}
          inputContainerStyle={{ backgroundColor: 'white', height: 20 }}
        />
        <TouchableOpacity onPress={() => {
          this.bsFilter.current.snapTo(0)
        }}>

          <Icons name="filter" size={32} color="#000" />
        </TouchableOpacity>

      </View>

    );
  };

  fall = new Animated.Value(1)
  bs = React.createRef()

  fallFilter = new Animated.Value(1)
  bsFilter = React.createRef()
  _renderItem = ({ item }) => {
    if (item.form) {
      const timestamp =
        item.timestamp && item.timestamp.seconds
          ? moment(item.timestamp.seconds * 1000).format('L[:]LTS')
          : 'Unknown';
      if (item.status == this.state.filterType) {
        return (
          <TouchableOpacity
            onLongPress={() => {

              this.setState({
                currentSelected: item.submissionId,
                currentSelectedFormId: item.formId
              })
            }}
          >
            <Card containerStyle={{ padding: 5, margin: 5 }}


            >
              <View style={{ flex: 1, flexDirection: 'row' }}>

                <View style={{ flex: 2, flexDirection: 'column' }}>
                  <Text style={{ fontWeight: '900', fontSize: 16 }}>{item.form.name}</Text>
                  <Text style={{ color: 'gray' }}>{timestamp}</Text>
                  <Text style={{ marginTop: 20 }}>{item.status}</Text>
                  <Text style={{ color: 'gray' }}>Id:{item.submissionId}</Text>

                </View>

                <View style={{ flex: 1, flexDirection: 'column' }}>
                  {this.makeSubmissionActionButton(item)}
                  <View>
                    {
                      this.state.currentSelected == item.submissionId && (item.status =='Incomplete' || item.status =='Ready' || item.status =='Submitted' ) ?
                        <Button
                          title="Delete"
                          type="clear"

                          buttonStyle={{ backgroundColor: 'transparent', fontSize: 20, color: 'red' }}
                          onPress={() => {
                            this.bs.current.snapTo(0)
                          }}
                        //backgroundColor="red"
                        />
                        :
                        null
                    }
                  </View>

                  <View>
                    {
                      this.state.currentSelected == item.submissionId ?
                        <Icons name="checkcircleo" size={20} color="green" style={{ textAlign: 'center' }} />
                        :
                        null
                    }
                  </View>
                </View>
              </View>

            </Card>
          </TouchableOpacity>
        )
      }
    }

  }
  render() {
    const { submissions,value } = this.state;
    
        if (submissions.length == 0 && value=='') {
          return (
            <View style={globalStyles.loaderScreenCentered}>
              <ActivityIndicator size="large" />
            </View>
          );
        }

    const tableHead = ['Timestamp', 'Form Name', 'Status', 'Actions', 'Delete'];
    // const tableData = this.makeArrayForTable(submissions);

    return (
      <View style={styles2.container}>

<Button title="Sort Ascending"

onPress={()=>this.ApplyFilterAscending()}
/>
<Button title="Sort Descending"

onPress={()=>this.ApplyFilterDescending()}
/>
        <BottomSheet
          ref={this.bsFilter}
          snapPoints={[400, 0]}
          renderContent={this.renderInnerFilter}
          renderHeader={this.renderHeaderFilter}
          initialSnap={1}
          callbackNode={this.fallFilter}
          enabledInnerScrolling={false}
          enabledContentGestureInteraction={false}
        />
        <Animated.View
          style={{
            alignItems: 'center',
            opacity: Animated.add(0.1, Animated.multiply(this.fall, 0.9)),
          }}
        >

        </Animated.View>



        <BottomSheet
          ref={this.bs}
          snapPoints={[300, 0]}
          renderContent={this.renderInner}
          renderHeader={this.renderHeader}
          initialSnap={1}
          callbackNode={this.fall}
          enabledInnerScrolling={false}
          enabledContentGestureInteraction={false}
        />
        <Animated.View
          style={{
            alignItems: 'center',
            opacity: Animated.add(0.1, Animated.multiply(this.fall, 0.9)),
          }}
        >

        </Animated.View>

        <FlatList
          data={submissions}
          renderItem={this._renderItem}

          refreshControl={
            <RefreshControl
              refreshing={this.state.isFetching}
              onRefresh={this.getData.bind()}


            />
          }
          // refreshing={this.state.isFetching}
          ListHeaderComponent={this.renderHeader2}
          keyExtractor={item => item.id}
        />
      </View>
    )
  }
}

const IMAGE_SIZE = 200

const styles2 = StyleSheet.create({
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
    height: 600,
    padding: 20,
    // backgroundColor: 'red',
    paddingTop: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 5,
    shadowOpacity: 0.6,
    backgroundColor: '#e0ebff'
  },
  header: {
    width: '100%',
    height: 50,
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

Submissions.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
  tryUpdateCurrentForm: PropTypes.func.isRequired,
  setCurrentFormData: PropTypes.func.isRequired,
  updateFirebaseSubmissionId: PropTypes.func.isRequired,
  fetchSubmissionDataFromCloud: PropTypes.func.isRequired,
  directSubmitDataFromCloudToFormio: PropTypes.func.isRequired,
};

const ConnectedSubmissions = connect(
  null,
  {
    setCurrentFormData: StoreActionsForm.setCurrentFormData,
    tryUpdateCurrentForm: StoreActionsForm.tryUpdateCurrentForm,
    initializeSubmission: StoreActionsSubmission.initializeSubmission,
    updateFirebaseSubmissionId:
      StoreActionsSubmission.updateFirebaseSubmissionId,
    fetchSubmissionDataFromCloud:
      StoreActionsSubmission.fetchSubmissionDataFromCloud,
    directSubmitDataFromCloudToFormio:
      StoreActionsSubmission.directSubmitDataFromCloudToFormio,
  },
)(Submissions);

export default ConnectedSubmissions;