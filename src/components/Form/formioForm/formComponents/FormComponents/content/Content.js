import React from 'react';
import {View, Linking} from 'react-native';
import {StyleSheet,Text} from 'react-native';
import HTMLView from 'react-native-htmlview';
import BaseComponent from '../sharedComponents/Base';

import { ScrollView, Dimensions } from "react-native";
import HTML from "react-native-render-html";

import styles from './styles';


export default class Content extends BaseComponent {
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
  render() {
    return (
      <View style={styles.content}>
        <Text>{this.props.component.label}</Text>
        <HTML
          html={this.props.component.html}
          imagesMaxWidth={Dimensions.get("window").width-50}
        />
     
      </View>
    );
  }
}
