


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
import IconsFontisto from 'react-native-vector-icons/Fontisto';
import IconsFeather from 'react-native-vector-icons/Feather';


import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import styles from '../../components/Profile/style';
import globalStyles from '../../globalStyles';
import StoreActionsForm from '../../store/actions/form';
import StoreActionsSubmission from '../../store/actions/submission';

import { Chip, Title } from 'react-native-paper';
import { IconButton, Colors } from 'react-native-paper';

import { Button as PaperButton } from 'react-native-paper';
const ITEM_HEIGHT=150;
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
      value: ''
    };
    this.arrayholder = [];
    this.onChangeSelect = this.onChangeSelect.bind(this);
  }

  handler = () => {
    alert("via handler");
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
              console.log('1' + data.submissionId);
              console.log('2' + submissionId);
              if (data.submissionId == submissionId) {
                console.log('3match' + submissionId);
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


     <Title>Delete:</Title>




      <Text>Do you want to delete this submission having Id
  <Text style={{ fontWeight: 'bold' }}>{" "}{this.state.currentSelected}</Text></Text>
      <Text style={{marginTop:10}}><Text style={{ fontWeight: 'bold',marginTop:10 }}>Disclaimer:</Text>After deleting data its associated media data will also will be deleted</Text>
      
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-around', marginTop: 20
      }}>
        <PaperButton style={{ backgroundColor: 'purple', paddingVertical: 5 }} icon="checkcircleo" mode="contained" onPress={() => console.log('Pressed')}
          onPress={() =>

            this.deleteSubmission(this.state.currentSelectedFormId, this.state.currentSelected)


          }

        >
          Confirm Delete
  </PaperButton>
        <PaperButton style={{ backgroundColor: 'blue', paddingVertical: 5 }} icon="closecircleo" mode="contained" onPress={() => console.log('Pressed')}
          onPress={() => {
            this.bs.current.snapTo(1)
    
            this.setState({
              currentSelected: null
            })
          }}
        >
          Close
  </PaperButton>

      </View>

      
      

    </View>


  )

  renderHeader = () => <View style={styles.header} />

  ApplyFilterDescending = () => {
    console.log("from descending");

    const { dateSorting, formSorting, currentFormName, submissions } = this.state;
    const newData = this.arrayholder.filter(item => {
      if (item.form) {
        if (item.status == this.state.filterType) {




          /*        this.arrayholder.sort((a, b) => {
        
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
        */


          return item;





        }
      }


    });
    const myData = newData
      .sort((a, b) => b.form.name.localeCompare(a.form.name))
    // .map((item5, i) =>  console.log('sort11' + JSON.stringify(item5.form.name)));


    console.log("mydata" + JSON.stringify(myData));
    this.setState({
      submissions: myData,
    });
  }
  ApplyFilterAscending = () => {
    console.log("from ascending");
    const { dateSorting, formSorting, currentFormName, submissions } = this.state;
    const newData = this.arrayholder.filter(item => {

      console.log("item" + JSON.stringify(item));
      if (item.form) {
        if (item.status == this.state.filterType) {



          return item;





        }
      }


    });
    const myData = newData
      .sort((a, b) => a.form.name.localeCompare(b.form.name))
    //    .map((item5, i) =>  console.log('sort11' + JSON.stringify(item5.form.name)));


    this.setState({
      submissions: myData,
    });
  }


  ApplyFilterAscending2 = (data) => {
    console.log("from ascending");
    const { dateSorting, formSorting, currentFormName, submissions } = this.state;
    if (formSorting == true) {
      const myData = data
        .sort((a, b) => a.form.name.localeCompare(b.form.name))
      this.setState({
        submissions: myData,
      });
    }
    else if (dateSorting == true) {
      const myData = data
        .sort((a, b) => {


          //a.timestamp._seconds.localeCompare(b.timestamp._seconds)

          if (a.timestamp._seconds > b.timestamp._seconds) { return -1; }
          if (a.timestamp._seconds < b.timestamp._seconds) { return 1; }
          return 0;

        })
      this.setState({
        submissions: myData,
      });
    }

  }

  ApplyFilter = () => {

    const { dateSorting, formSorting, currentFormName, submissions } = this.state;
    const newData = this.arrayholder.filter(item => {
      if (item.form) {
        if (item.status == this.state.filterType) {
          if (currentFormName == 'all') {




            return item;
          }
          else {
            if (currentFormName == item.form.name) {
              return item
            }
          }




        }
      }


    });

    this.ApplyFilterAscending2(newData);
    /*this.setState({
      submissions: newData,
    });*/

  }

  onChangeSelect(selected) {
    this.setState({
      currentFormName: selected
    });

  }
  renderInnerFilter = () => (

    <View style={styles2.panel}>



      <Title>Filter By :</Title>
      <View
        style={{
          flexDirection: "row",
          // backgroundColor: "yellow",
          // flex: 1,
          justifyContent: "space-around"
        }}
      >
        <Chip style={{ paddingHorizontal: 10, paddingVertical: 5 }} icon="clockcircleo" onPress={() =>
          this.setState({
            dateSorting: true,
            formSorting: false
          })

        }
          selected={this.state.dateSorting}
          selectedColor="purple"

        >Date</Chip>
        <Chip style={{ paddingHorizontal: 10, paddingVertical: 5 }} icon="form"
          onPress={() =>
            this.setState({
              dateSorting: false,
              formSorting: true
            })

          }
          selected={this.state.formSorting}
          selectedColor="purple"


        >Form Name</Chip>

      </View>



      <View style={{ marginTop: 20 }} />
      <Title>Select Form:</Title>
      <Dropdown
        // label='Forms'



        onChangeText={this.onChangeSelect}

        data={this.state.forms}
        value={this.state.currentFormName}

      // onPress={() => { }}
      />

      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-around', marginTop: 20
      }}>
        <PaperButton style={{ backgroundColor: 'purple', paddingVertical: 5 }} icon="checkcircleo" mode="contained" onPress={() => console.log('Pressed')}
          onPress={() =>

            this.ApplyFilter()



          }

        >
          Apply
  </PaperButton>
        <PaperButton style={{ backgroundColor: 'blue', paddingVertical: 5 }} icon="closecircleo" mode="contained" onPress={() => console.log('Pressed')}
          onPress={() => this.bsFilter.current.snapTo(1)}

        >
          Close
  </PaperButton>

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
      <View style={{ backgroundColor: '#fff' }}>

        <View style={{ flex: 1, flexDirection: 'row', marginTop: 20, marginBottom: 20, marginHorizontal: 10, borderWidth: 0 }}>
          <SearchBar
            style={{}}
            placeholder="Search"
            lightTheme
            round
            onChangeText={text => this.searchFilterFunction(text)}
            autoCorrect={false}
            value={this.state.value}
            inputStyle={{ borderColor: '#fff', borderWidth: 0 }}
            //inputStyle={{ backgroundColor: 'F4F5FC',borderColor:'#D3D3D3',borderRadius: 10, }}
            containerStyle={{ backgroundColor: '#fff', borderWidth: 0, width: '90%', borderColor: '#fff' }}
            placeholderTextColor={'#000'}
            inputContainerStyle={{ borderColor: '#fff', borderWidth: 0, backgroundColor: '#F4F5FC', height: 40, }}
          />
          <TouchableOpacity onPress={() => {
            this.bsFilter.current.snapTo(0)
          }}>

            <Icons name="filter" size={32} color="#000" />
          </TouchableOpacity>

        </View>

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
          onPress={() => {
            this.setState({
              currentSelected: item.submissionId,
              currentSelectedFormId: item.formId
            });
            // this.bs.current.snapTo(0)
          }}
          
          >
            <Card containerStyle={{ paddingVertical: 10, marginBottom: 15, marginHorizontal: 10, borderRadius: 6 }}
              onPress={() => {
                this.setState({
                  currentSelected: item.submissionId,
                  currentSelectedFormId: item.formId
                });
                // this.bs.current.snapTo(0)
              }}

            >
              <View style={{ flex: 1, flexDirection: 'row' }}>

                <View style={{ flex: 2, flexDirection: 'column' }}>
                  <Text style={{ fontWeight: '900', marginTop: 5, fontSize: 17, fontFamily: 'sans-serif-medium' }}>{item.form.name}</Text>
                  <Text style={{ color: '#000', marginTop: 10 }}><IconsFontisto name="date" size={16} color="#000" /><Text style={{ marginRight: 20 }}>{' '}{timestamp}</Text></Text>

                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }}>
                    <Chip icon="tag" style={{ marginTop: 20 }} onPress={() => console.log('Pressed')}>{item.status}</Chip>

                  </View>
                  {
                    this.state.currentSelected == item.submissionId && (item.status == 'Incomplete' || item.status == 'Ready' || item.status == 'Submitted') ?

                      <Text style={{ color: 'gray' }}>Id:{item.submissionId}</Text>
                      :
                      null}
                </View>

                <View style={{ flex: 1, flexDirection: 'column' }}>

                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', alignSelf: 'flex-end' }}>
                    <IconButton
                      icon="delete"
                      color={Colors.red500}
                      size={20}
                      onPress={() => {
                        this.setState({
                          currentSelected: item.submissionId,
                          currentSelectedFormId: item.formId
                        });
                        this.bs.current.snapTo(0)
                      }}
                    />
                    <TouchableOpacity onPress={() => {
                      console.log('aaaaaaaaaaaaaas'),
                        this.setState({
                          currentSelected: item.submissionId,
                          currentSelectedFormId: item.formId
                        })

                    }}>
                      <IconsFeather
                        name="more-vertical"
                        color='gray'
                        size={20}
                        style={{ marginTop: -50 }}
                        onPress={() => {
                          console.log('aaaaaaaaaaaaaas'),
                            this.setState({
                              currentSelected: item.submissionId,
                              currentSelectedFormId: item.formId
                            });
                        }}
                      />


                    </TouchableOpacity>




                  </View>


                  {this.makeSubmissionActionButton(item)}


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
  getItemLayout=(data, index)=>{
    return {
      length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index
    }
  }

  

  render() {
    const { submissions, value } = this.state;
    if (submissions.length == 0 && value == '') {
      return (
        <View style={globalStyles.loaderScreenCentered}>
          <ActivityIndicator size="large" />
        </View>
      );
    }
  
    const tableHead = ['Timestamp', 'Form Name', 'Status', 'Actions', 'Delete'];
    // const tableData = this.makeArrayForTable(submissions);
  
    return (
      <>
        <View style={[styles2.container, {
  
          backgroundColor: '#F4F4F4'
  
  
  
        }]}
  
  
        >
  
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
              opacity: Animated.add(0.1, Animated.multiply(this.fallFilter, 1)),
            }}
          >
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
              initialNumToRender={5}
              keyExtractor={item => item.id}
              getItemLayout={this.getItemLayout}
            />
          </Animated.View>
  
  
  
  
  
        </View>
        <BottomSheet
          style={{ backgroundColor: '#fff', opacity: 1 }}
          ref={this.bsFilter}
          snapPoints={[400, 0]}
          renderContent={this.renderInnerFilter}
          renderHeader={this.renderHeaderFilter}
          initialSnap={1}
          callbackNode={this.fallFilter}
          enabledInnerScrolling={false}
          enabledContentGestureInteraction={false}
        />
      </>
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
    backgroundColor: '#fff'
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