import React, { useState } from 'react';
import { useSelector } from 'react-redux'
import { View } from 'react-native';
import { IconButton, Title } from 'react-native-paper';
import PropTypes from 'prop-types';
import FormioComponentsList from '../../FormioComponentsList';
import H3 from '../h3/H3';
import styles from './styles';
import { Collapse, CollapseHeader, CollapseBody } from 'accordion-collapse-react-native';
import { List } from 'react-native-paper';
import { FormioComponents } from './../../../factories/FormioComponents';

const Fieldset = (props) => {
  const currentCard = useSelector(state => {
    return state.datagridreducer;
  });
  const [expandable, setExpandable] = useState(true);
  const legend = (props.component.legend ? props.component.legend : 'Fieldset');
  const ourcomponent = props.component.components;



  if (props.dgId) {
    return (
      <View style={styles.fieldset}>
      <Collapse
        isCollapsed={expandable}
        onToggle={(expandable) => setExpandable(!expandable)}
      >
        <CollapseHeader>
          <List.Item
            title={legend}
            right={props => <IconButton
              icon={expandable == true ? 'downcircleo' : 'upcircleo'}
              color="red"
              size={30}
              onPress={() => setExpandable(!expandable)}
            />}
          />
        </CollapseHeader>
        <CollapseBody>
          {ourcomponent.map((component, index) => {
            component.datagridItem = props.datagridItem;
            component.datagridId = props.currentItem.id;
            const key = component.key || component.type + index;
            const currentValue = props.mycomp.value;
            const value = props.currentItem.id == currentCard ? props.currentItem[key] : '';
            const FormioElement = FormioComponents.getComponent(component.type);
            if (!FormioElement) return null;
            if (props.mycomp.checkConditional(component, props.mycomp.row)) {
              return (
                <>
                  <FormioElement
                    {...props.mycomp}
                    readOnly={props.mycomp.isDisabled(component)}
                    name={component.key}
                    key={key}
                    component={component}
                    value={value}
                    dgId={props.currentItem.id}
                    datagridItem={props.datagridItem}
                    datagridId={props.currentItem}
                    parentdgId={props.currentItem.id}
                    parentlevel={props.level}
                    mycomp={props.getComponentmycomp}
                  />
                </>

              )

            }
          })
          }
        </CollapseBody>
      </Collapse>
    </View>);


  }








  else {
    return (
      <View style={styles.fieldset}>
        <Collapse
          isCollapsed={expandable}
          onToggle={(expandable) => setExpandable(!expandable)}

        >
          <CollapseHeader>

            <List.Item
              title={legend}

              right={props => <IconButton
                icon={expandable == true ? 'downcircleo' : 'upcircleo'}
                color="red"
                size={30}
                onPress={() => setExpandable(!expandable)}
              />}
            />
          </CollapseHeader>
          <CollapseBody>

            <FormioComponentsList
              {...props}
              components={props.component.components}
            ></FormioComponentsList>
          </CollapseBody>

        </Collapse>
      </View>
    );
  }


};

Fieldset.propTypes = {
  component: PropTypes.object,
  theme: PropTypes.object,
  colors: PropTypes.object
};

export default Fieldset;

