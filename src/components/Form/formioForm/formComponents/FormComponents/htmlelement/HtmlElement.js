import React from 'react';
import {View, Text,StyleSheet} from 'react-native';
import BaseComponent from '../sharedComponents/Base';
import H3 from '../h3/H3';
import H2 from '../h2/H2';
import styles from './styles';
import HTMLView from 'react-native-htmlview';
import { checkCondition, evaluate,evaluate2, checkCalculated,checkTrigger } from '../../../../formio/utils/utils';
const tags = {
  h2: H2,
  h3: H3,
  default: Text
};
const htmlStylesSocial = StyleSheet.create({
  bgInfo:{
    width:'100%',
    backgroundColor:'skyblue',
    padding:2
  }, textWhite:{
color:'#fff'
  },
    div: {
      backgroundColor: "#F2F2F2",
      //padding: 15
    },
    p: {
      color: "#1d1d1d",
      fontFamily: "LucidaGrande",
      fontSize: 16,
      lineHeight: 24,
      margin: 0,
      padding: 0,
      backgroundColor: "pink"
    },
    h1: {
      color: "#1d1d1d",
      fontFamily: "LucidaGrande-Bold",
      fontSize: 20,
      lineHeight: 30,
      backgroundColor: "pink"
    },
    h2: {
      color: "#1d1d1d",
      fontFamily: "LucidaGrande-Bold",
      fontSize: 20,
      lineHeight: 30,
      backgroundColor: "pink"
    },
    h3: {
      color: "#1d1d1d",
      fontFamily: "LucidaGrande-Bold",
      fontSize: 20,
      lineHeight: 30,
      backgroundColor: "pink",
      margin: 0,
    },
    em: {
      fontStyle: "italic"
    },
    a: {
      color: "#34639A"
    }
  })
export default class HTMLElement extends BaseComponent {
  constructor(props) {
    super(props);
    this.onLinkPress = this.onLinkPress.bind(this);
    this.getHtmlStyles = this.getHtmlStyles.bind(this);
  }
  getHtmlStyles() {
    return {
      p: {
        ...StyleSheet.flatten(styles.p),
        color: this.props.colors.textColor,
      },
    };
  }

  onLinkPress(url) {
    Linking.openURL(url).catch(e => {
      return e;
    });
  }
  renderContent() {
    let Tag = tags.default;
    if (tags.hasOwnProperty(this.props.component.tag.toLowerCase())) {
      Tag = tags[this.props.component.tag.toLowerCase()];
    }
    return (<Tag>{this.props.component.content}</Tag>);
  }

  

  render() {
     
    return (
      <View style={styles.content}>
       {/*this.renderContent()*/}
       <HTMLView
          value={this.props.component.content}
          addLineBreaks={false}
          //stylesheet={this.getHtmlStyles()}
          onLinkPress={this.onLinkPress}
          stylesheet={htmlStylesSocial}
        />
        
      </View>
    );
  }
}
