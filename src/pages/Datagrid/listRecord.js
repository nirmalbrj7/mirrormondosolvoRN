import React, { useLayoutEffect } from 'react';
import { Text, FlatList, View, TouchableOpacity, StyleSheet, Button } from 'react-native';
import { useSelector, useDispatch } from 'react-redux'
import { FormioComponents } from '../../components/Form/formioForm/factories';
import { Icon } from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
const ListRecord = (props) => {
  const navigation = useNavigation();
  const params = props.route.params;
  console.log("11111111" + JSON.stringify(params.onSelect("sakar")));
  const listcomponent = params.listcomponent;
  const newstate = params.newstate;
  const ourcomponent = params.ourcomponent;
  const parentKey = params.parentKey;
  const type = params.type;
  //props.navigation.state.params.onSelect({ selected: true });

  //navigation.navigate('AddRecord');

  const dispatch = useDispatch();

  const currentCard = useSelector(state => {
    return state.datagridreducer;
  });

  useLayoutEffect(() => {


    navigation.setOptions({
      headerLeft: () => <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text>sss</Text>
      </TouchableOpacity>,
      headerTitle: () => <Text>{type}</Text>

    });
  }, [navigation]);
  const isEmpty = (obj) => {
    for (var key in obj) {
      if (obj.hasOwnProperty(key))
        return false;
    }
    return true;
  }
  const mycomp = props.listcomponent;



  if (isEmpty(newstate)) {
    return null;
  }
  else {
    if (newstate) {
   // alert("Newstate"+JSON.stringify(newstate));
      var result = newstate.filter(value => JSON.stringify(value) !== '[]');
      console.log("result"+JSON.stringify(newstate));
      console.log("types" + JSON.stringify(result));
      console.log("ourcomponent" + JSON.stringify(ourcomponent));
      return (
        <>
<Text>nnn:{JSON.stringify(newstate)}</Text>
  
     

          <FlatList
            data={result}
            renderItem={({ item, datagridIndex }) => (


              item.id ?

                <View style={{ marginLeft: 0 }}>
                  <TouchableOpacity
                    onPress={(event) => { dispatch({ type: 'select_card', payload: item.id }) }}
                  >

                    <View style={currentCard != item.id ? { backgroundColor: 'gray' } : {}}>
                      <View >
                        <Icon
                          raised
                          name='close'
                          type='font-awesome'
                          color='#f50'
                          style={currentCard != item.id ? { backgroundColor: 'gray' } : {}}

                          onPress={(event) => {

                            params.onSelect(item.id),
                              dispatch({ type: 'remove_card', payload: item.id })

                          }} />
                      </View>


                    </View>

                  </TouchableOpacity>

                  <View>
                    {ourcomponent.map((component, index) => {
                      component.datagridItem = parentKey;
                      component.datagridIndex = datagridIndex;
                      component.datagridId = item.id;
                      const key = component.key || component.type + index;

                      const value = (item.hasOwnProperty(key) ? item[key] : listcomponent.values && listcomponent.values.hasOwnProperty(component.key)
                        ? mycomp.values[component.key]
                        : null);


                      const FormioElement = FormioComponents.getComponent(component.type);



                   //   if (component.hasOwnProperty != 'components') {

                        if (!FormioElement) return null;
                        //  if (mycomp.checkConditional(component, listcomponent.row)) {
                        return (
<>
                        <Text>{parentKey}</Text>
                        <Text>{key}</Text>
                          <FormioElement
                            {...listcomponent}
                            readOnly={listcomponent.isDisabled(component)}
                            name={component.key}
                            key={key}
                            component={component}
                            value={value}
                            dgId={item.id}
                          />
</>

                        )

                    //  }

                      //}
                      return null;
                    })


                    }

                  </View>


                </View>
                :
                null

            )}
            keyExtractor={item => item.id}
          />
          <Button title="AddCard" onPress={() => {
            dispatch({
              type: 'add_card', payload: {
                key: 'pp',
                components: 'ssss',
                data: 'ssssss'
              }
            })
          }} />
        </>
      );
    }
    else {
      return null;
    }
  }



}
export default ListRecord;