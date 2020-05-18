import React from 'react';
import {View, ActivityIndicator, ScrollView} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import {Table, Row, Rows} from 'react-native-table-component';

import {Text} from 'react-native-elements';
import styles from '../../components/Profile/style';
import globalStyles from '../../globalStyles';

function sortPage(a, b) {
  return a[0].slice(4) - b[0].slice(4);
}

class SubmissionView extends React.PureComponent {
  state = {
    submissionData: null,
  };

  componentDidMount() {
    const {route} = this.props;
    const {submissionId} = route.params;
    firestore()
      .collection('submissions')
      .doc(submissionId)
      .get()
      .then(docSnapshot => {
        this.setState({submissionData: docSnapshot.data().rawSubmission});
      });
  }

  makeArrayForTable = page =>
    page
      ? Object.entries(page).map(item => {
        var base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
var check=base64regex.test(item[1]); 

  // TRUE
          if (Array.isArray(item[1])) {
            return [item[0], item[1][0].originalName];
          }
          if (typeof item[1] === 'object' && item[1]) {
            return [item[0], JSON.stringify(item[1])];
          }
          return item;
        })
      : null;

  render() {
    const {submissionData} = this.state;

    if (!submissionData) {
      return (
        <View style={globalStyles.loaderScreenCentered}>
          <ActivityIndicator size="large" />
        </View>
      );
    }
    const tableHead = ['Key', 'Value'];
    return (
      <ScrollView>
        <View style={globalStyles.scrollableTableContainer}>
          {submissionData &&
            Object.entries(submissionData.data)
              .sort(sortPage)
              .map(page => (
                <>
                  {page[0] !== '__root' && <Text>{page[0]}</Text>}
                  <Table borderStyle={styles.tableBorder}>
                    <Row
                      data={tableHead}
                      style={styles.tableHead}
                      textStyle={styles.tableText}
                    />
                    <Rows
                      data={this.makeArrayForTable(page[1])}
                      textStyle={styles.tableText}
                    />
                  </Table>
                </>
              ))}
        </View>
      </ScrollView>
    );
  }
}

export default SubmissionView;
