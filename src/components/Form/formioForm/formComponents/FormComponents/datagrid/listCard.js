import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { View, Text, Button, FlatList, StyleSheet } from 'react-native';
import { Avatar, Card, Title, Paragraph, IconButton } from 'react-native-paper';

import { FormioComponents } from './../../../factories/FormioComponents';
import Textarea from '../textarea/Textarea';
import { Icon } from 'react-native-elements';
import RemoveCard from './removeCard';
export const listCard = (props) => {
  const dispatch = useDispatch();
  const newstate = props.newstate;
  const ourcomponent = props.ourcomponent;
  const listcomponent = props.listcomponent;
  const parentKey = props.parentKey;
  //dispatch({ type: 'select_card',payload:initdata});

  const currentCard = useSelector(state => {
    console.log("STATE" + JSON.stringify(state.datagridreducer))
    return state.datagridreducer;
  });


  const myCallback = () => {
    console.log('callback aayo');
  };
  const isEmpty = (obj) => {
    for (var key in obj) {
      if (obj.hasOwnProperty(key))
        return false;
    }
    return true;
  }

  //currentPageSubmissionData
  const mycomp = props.listcomponent;
  var mycompLengthmycompLength = Object.keys(mycomp).length === 0;
  //console.log('AAAA' + mycompLengthmycompLength);

  var myObj = {}; // Empty Object
  if (isEmpty(newstate)) {
    console.log('empty 6');
    // Object is empty (Would return true in this example)
  } else {
    if (newstate.value.item) {
      const cardData = newstate.value.item;
      //const removeprops
      return (<View>
        <FlatList
          data={cardData}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Card
                style={currentCard != item.id ? { backgroundColor: 'gray' } : {}}
                onPress={(event) => { dispatch({ type: 'select_card', payload: item.id }) }}
              >
                <Card.Title title={`Card No`}


                  right={() => (
                    <Icon
                      raised
                      name='close'
                      type='font-awesome'
                      color='#f50'
                      style={currentCard != item.id ? { backgroundColor: 'gray' } : {}}
                      onPress={(event) => { props.action(item.id) }} />


                  )}
                />
                <Card.Content>

                  {ourcomponent.map((component, index) => {
                    component.datagridItem = parentKey;
                    component.datagridId = item.id;
                    const key = component.key || component.type + index;

                    const value = (item.hasOwnProperty(key) ? item[key] : listcomponent.values && listcomponent.values.hasOwnProperty(component.key)
                      ? mycomp.values[component.key]
                      : null);


                    const FormioElement = FormioComponents.getComponent(component.type);
                    if (!FormioElement) return null;
                    if (mycomp.checkConditional(component, listcomponent.row)) {
                      return (
                       
                        <FormioElement
                          {...listcomponent}
                          readOnly={listcomponent.isDisabled(component)}
                          name={component.key}
                          key={key}
                          component={component}
                          value={value}
                          dgId={item.id}
                        //callbackau6={myCallback}

                        />
                     

                      )

                    }
                    return null;
                  })


                  }
                </Card.Content>
              </Card>
            </View>
          )}
          keyExtractor={item => item.id}
        />




      </View>);
    }
    else {
      return (<View><Text>item 6aina{JSON.stringify(newstate.value.item)}</Text></View>)
    }

  }

  return (<View></View>);



}
export default listCard;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 5,
  },
  item: {
    backgroundColor: '#f9c2ff',
    padding: 5,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 32,
  },
});
