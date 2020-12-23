import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Dimensions, Platform, ScrollView } from 'react-native';
import { Card, IconButton, Button, Title, Paragraph } from 'react-native-paper';
import { Modal as PaperModal, Portal, Provider, Divider, Avatar, List } from 'react-native-paper';
import { FormioComponents } from './../../../factories/FormioComponents';
import Modal from 'react-native-modal';

export const listCard = (props) => {
  const [visible, setVisible] = React.useState(false);


  const [, updateState] = React.useState();
  const forceUpdate = React.useCallback(() => updateState({}), []);



  const [isModalVisible, setModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [currentDatagridIndex, setCurrentDatagridIndex] = useState(null);




  const deviceWidth = Dimensions.get("window").width;
  const deviceHeight = Platform.OS === "ios"
    ? Dimensions.get("window").height
    : 999;
  const openModal = (id) => {
    dispatch({ type: 'select_card', payload: id })
    setModalVisible(!isModalVisible);
  };
  const closeModal = (id) => {
    setModalVisible(!isModalVisible);
  };
  const dispatch = useDispatch();
  const newstate = props.newstate;
  const ourcomponent = props.ourcomponent;
  const listcomponent = props.listcomponent;
  const parentKey = props.parentKey;
  const ButtonTitle = props.ButtonTitle;
  const action = props.action;
  const LeftContent = props =>



    <IconButton
      icon="checkcircleo"
      color="green"
      size={40}
      onPress={() => closeModal()}

    />






  const currentCard = useSelector(state => {
    return state.datagridreducer;
  });
  useEffect(() => {
    forceUpdate
    //alert("change"+currentCard);

  }, [currentCard])


  const isEmpty = (obj) => {
    for (var key in obj) {
      if (obj.hasOwnProperty(key))
        return false;
    }
    return true;
  }

  const dynamicData2 = (item, ButtonTitle, ourcomponent, datagridIndex) => {
    alert("items" + item.id);

  }

  const dynamicData = () => {
    // alert(item.id);

    return (

      <ScrollView>
        <Card style={{ flex: 1 }}>
          <Card.Title title={ButtonTitle} right={LeftContent} />

          <View style={{
            borderWidth: 0.2, borderColor: 'gray', shadowColor: "gray",
            shadowOffset: {
              width: 0,
              height: 1,
            },
            shadowOpacity: 0.22,
            shadowRadius: 1.22,

            elevation: 1, marginBottom: 10
          }} />
          <Card.Content>
            {

              currentItem ?
                currentItem.id ?
                  <View>

                    {ourcomponent.map((component, index) => {



                      if (component.type == 'fieldset') {
                        component.datagridItem = parentKey;
                        component.datagridIndex = currentDatagridIndex;
                        component.datagridId = currentItem.id;
                        // component.datagridItem = parentKey;
                        console.log("==========================================================");
                        console.log("==========================================================");
                        console.log("==========================================================");
                        console.log("11props.datagridItem"+JSON.stringify(parentKey));
                        console.log(" 11props.datagridIndex"+JSON.stringify( currentDatagridIndex));
                        console.log("11props.currentItem"+JSON.stringify(currentItem.id));
                        console.log("==========================================================");
                        console.log("==========================================================");
                        console.log("==========================================================");

                        const key = component.key || component.type + index;
                        const currentValue = mycomp.value;
                        const value = currentItem.id == currentCard ? currentItem[key] : '';
                        const FormioElement = FormioComponents.getComponent(component.type);
                        if (!FormioElement) return null;
                        if (mycomp.checkConditional(component, listcomponent.row)) {
                          return (
                            <>
      
              
                              <FormioElement
                                {...listcomponent}
                                readOnly={listcomponent.isDisabled(component)}
                                name={component.key}
                                key={key}
                                component={component}
                                value={value}
                                dgId={currentItem.id}
                                level={props.level}
                                datagridItem={parentKey}
                                datagridIndex={currentDatagridIndex}
                                currentItem={currentItem}
                                mycomp={mycomp}
                            //    parentlevel={this.props.parentlevel?this.props.parentlevel:null}
                              //  parentdgId={this.props.parentdgId?this.props.parentdgId:null}
                              //callbackau6={myCallback}

                              />
                            </>

                          )

                        }





                      }
                      else {
                        component.datagridItem = parentKey;
                        component.datagridIndex = currentDatagridIndex;
                        component.datagridId = currentItem.id;
                        // component.datagridItem = parentKey;


                        const key = component.key || component.type + index;
                        const currentValue = mycomp.value;
                        const value = currentItem.id == currentCard ? currentItem[key] : '';
                        const FormioElement = FormioComponents.getComponent(component.type);
                        if (!FormioElement) return null;
                        if (mycomp.checkConditional(component, listcomponent.row)) {
                          return (
                            <>

                              <FormioElement
                                {...listcomponent}
                                readOnly={listcomponent.isDisabled(component)}
                                name={component.key}
                                key={key}
                                component={component}
                                value={value}
                                level={props.level}
                                dgId={currentItem.id}
                               // parentlevel={this.props.parentlevel?this.props.parentlevel:null}
                               // parentdgId={this.props.parentdgId?this.props.parentdgId:null}

                              //callbackau6={myCallback}

                              />
                            </>

                          )

                        }
                      }



                      return null;
                    })


                    }
                  </View>
                  : null
                : null
            }



          </Card.Content>
        </Card>

      </ScrollView>


    );
  }

  const mycomp = props.listcomponent;
  if (isEmpty(newstate)) {
    console.log('empty 6');
    // Object is empty (Would return true in this example)
  } else {
    if (newstate) {
      const cardData = newstate;
      var result = cardData.filter(value => JSON.stringify(value) !== '[]');
      return (
        <ScrollView style={{ padding: 2 }}>



          <FlatList
            data={result}
            renderItem={({ item, datagridIndex }) => (
              item.id ?
                <View style={{}}>

                  <Card elevation={2} style={{ marginBottom: 10, padding: 0, borderLeftWidth: 3, borderLeftColor: 'skyblue' }}>



                    <List.Item
                      title="Card Number"
                      description={item.id}
                      left={props => <Avatar.Icon size={40} icon="creditcard" />}
                      right={props => <View style={{ flex: 1, flexDirection: 'row' }}>
                        <TouchableOpacity onPress={() => {

                          setCurrentItem(item);
                          setCurrentDatagridIndex(datagridIndex);
                          openModal(item.id)
                        }}>


                          <List.Icon {...props} icon="edit" onPress={() => {

                            setCurrentItem(item);
                            setCurrentDatagridIndex(datagridIndex);
                            openModal(item.id)
                          }} />
                        </TouchableOpacity>

                        <TouchableOpacity {...props} onPress={() => {
                          action(item.id)
                        }}
                        >

                          <List.Icon {...props} icon="close" onPress={(event) => { alert("sss"), action(item.id) }} />
                        </TouchableOpacity>



                      </View>}
                    />





                  </Card>








                  <Modal isVisible={isModalVisible}
                    animationType="slide"
                    coverScreen={true}
                    deviceWidth={deviceWidth}
                    deviceHeight={deviceHeight}
                    propagateSwipe
                    style={styles.modal}
                  >
                    {dynamicData()}
                  </Modal>


                </View>
                : null
            )}
            keyExtractor={item => item.id}
          />





        </ScrollView>);
    }
    else {
      return (null)
    }

  }

  return (<View></View>);



}
export default listCard;
const styles = StyleSheet.create({
  modal: {
    backgroundColor: 'white',
    margin: 0, // This is the important style you need to set
    alignItems: undefined,
    justifyContent: undefined,
    flex: 1,
  },
  container: {
    flex: 1,
    marginTop: 5,
  },
  item: {
    //  backgroundColor: '#f9c2ff',
    paddingVertical: 5,

    marginVertical: 8,
    paddingHorizontal: 0,
    marginHorizontal: 0,
  },
  title: {
    fontSize: 32,
  },
});
