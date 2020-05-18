import React from 'react';
import PropTypes from 'prop-types';
import { View, StyleSheet,Text } from 'react-native';

import { FormioComponents } from '../factories';

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
});

const FormioComponentsList = props => (
  <View style={styles.wrapper}>

    {props.components.map((component, index) => {
      if(component.type=='datagriddd'){

      return(
        <View>
          <Text>jpt{JSON.stringify(component.components)}</Text>
          {component.components.map((component2, index2) => {
            component2.dgg="abcd";
                const key = component2.key || component.type + index2;
                const value = (props.values && props.values.hasOwnProperty(component2.key)
                  ? props.values[component2.key]
                  : null);
                const FormioElement = FormioComponents.getComponent(component2.type);
                if (!FormioElement) return null;
                return<View>
                <Text>comp2{JSON.stringify(props.values)}</Text>
                <FormioElement
          {...props}
          readOnly={props.isDisabled(component2)}
          name={component2.key}
          key={key}
          component={component2}
          value={value}
          datagrid='11111'
        />
              </View>

          })
        }
        </View>
      );

       
      }
      else{
        const key = component.key || component.type + index;
        const value = (props.values && props.values.hasOwnProperty(component.key)
          ? props.values[component.key]
          : null);
        const FormioElement = FormioComponents.getComponent(component.type);
        if (!FormioElement) return null;
        if (props.checkConditional(component, props.row)) {
          return (
            <View>
            <FormioElement
              {...props}
              readOnly={props.isDisabled(component)}
              name={component.key}
              key={key}
              component={component}
              value={value}
            />
            </View>
  
          );
        }
      }


      return null;
    })}
  </View>
);

FormioComponentsList.propTypes = {
  components: PropTypes.array.isRequired,
  values: PropTypes.any,
  row: PropTypes.any,
  isDisabled: PropTypes.func,
  checkConditional: PropTypes.func,
};

export default FormioComponentsList;
