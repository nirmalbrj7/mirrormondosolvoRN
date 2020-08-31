import React from 'react';
import {View, Text,StyleSheet} from 'react-native';
import BaseComponent from '../sharedComponents/Base';
import H3 from '../h3/H3';
import H2 from '../h2/H2';
import styles from './styles';
import HTMLView from 'react-native-htmlview';
const tags = {
  h2: H2,
  h3: H3,
  default: Text
};

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
          stylesheet={this.getHtmlStyles()}
          onLinkPress={this.onLinkPress}
        />
      </View>
    );
  }
}
