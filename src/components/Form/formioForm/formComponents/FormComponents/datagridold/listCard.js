import React from 'react'
import { useSelector } from 'react-redux'
import { View, Text, Button, FlatList, StyleSheet } from 'react-native';
import { Avatar, Card, Title, Paragraph, IconButton } from 'react-native-paper';
import RemoveData from './removeCard';
import { FormioComponents } from './../../../factories/FormioComponents';

export const CounterComponent = (props) => {
  const formDisplay = useSelector(
    state => state.form && state.form.form && state.form.form.display,
  );
  const newform=useSelector(state=>state);
  const cardData = useSelector(state => {
    console.log("STATE" + JSON.stringify(state.datagridreducer))
    return state.datagridreducer;
  });
  const mycomp = props.newComp;
  const orginalcomponent = props.mycomp;
  const {
    component, name, readOnly, colors, theme,
  } = props.newComp;
  
  return (
    <View>

      <FlatList
        data={cardData}
        renderItem={({ item }) => (
          <View style={styles.item}>


            <Card>
              <Card.Title title='Card'
                right={(props) => (
                  <RemoveData toremove={item.id} />


                )}

              />
              <Card.Content>
                {item.schema.map((component, index) => {
                  const key = component.key || component.type + index;
                  const value = (mycomp.values && mycomp.values.hasOwnProperty(component.key)
                    ? mycomp.values[component.key]
                    : null);
                  const FormioElement = FormioComponents.getComponent(component.type);
                  if (!FormioElement) return null;
                  if (mycomp.checkConditional(component, mycomp.row)) {
                    return (<View>
                      <FormioElement
                        {...mycomp}
                        readOnly={mycomp.isDisabled(component)}
                        name={component.key}
                        key={key}
                        component={component}
                       value={value}
                      
                      />
                    </View>

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
      <View>


      </View>
    </View>
  )
}
export default CounterComponent;
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
