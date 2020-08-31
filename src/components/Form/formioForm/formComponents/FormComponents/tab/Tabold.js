import React,{ Component,useEffect } from 'react';
import FormioComponentsList from '../../FormioComponentsList';
import { Platform, StyleSheet, Text, View, Alert } from "react-native";
import {Card} from 'react-native-elements/src/index';
import PropTypes from 'prop-types';
import styles from './styles';
import DynamicTabView from "react-native-dynamic-tab-view";

const Tabs = (props) => {
  const title = (props.component.title && !props.component.hideLabel ? props.component.title : undefined);
  const titleStyle = {...StyleSheet.flatten(styles.title), color: props.colors.secondaryTextColor};
  
  const tabComponent=props.component.components;
  var data = [

  ];

  useEffect(()=>{
  
    tabComponent.map((val,index)=>{

        data.push({
          title:val.label,
          key:Math.round(),
          color:'#000000',
          components:val.components
        });
    });
  });



 const _renderItem = (item, index) => {
   // console.log("renderItem", index);
    return (
      <View
        key={item["key"]}
        style={{flex: 1,backgroundColor:'red',padding:20,flexWrap:'nowrap' }}
      >
      
        <FormioComponentsList style={{marginTop:20,padding:20}}
            {...props}
            components={item.components}
          ></FormioComponentsList>
        </View>
    );
  };

  const onChangeTab = index => {};


    return (
      <Card containerStyle={styles.panel} title={title} titleStyle={titleStyle}>
     
        <View style={styles.componentsWrapper}>

    <Text>{JSON.stringify(tabComponent)}</Text>

<DynamicTabView 
        data={data}
        renderTab={_renderItem}
        defaultIndex={0}
        containerStyle={styles.container}
        headerBackgroundColor={'white'}
        headerTextStyle={styles.headerText}
        onChangeTab={onChangeTab}
        headerUnderlayColor={'blue'}
      />
        </View>
      </Card>
    );
};

Tabs.propTypes = {
  component: PropTypes.object,
  theme: PropTypes.object,
  colors: PropTypes.object
};

export default Tabs;
