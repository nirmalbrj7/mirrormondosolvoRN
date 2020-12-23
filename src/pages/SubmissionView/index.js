import React,{useState,useEffect} from 'react';
import { View, ActivityIndicator, ScrollView} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { Table, Row, Rows } from 'react-native-table-component';
import styles from '../../components/Profile/style';
import globalStyles from '../../globalStyles';
import { connect } from 'react-redux';
import { useSelector, useDispatch } from 'react-redux'
function sortPage(a, b) {
  return a[0].slice(4) - b[0].slice(4);
}

const SubmissionView =(props)=> {
  const [submissionData,setSubmissionData]=useState(null);
  const [subData,setSubData]=useState(null);
  const orgSlug = useSelector(state => {
    //console.log("STATE" + JSON.stringify(state.datagridreducer))
    return state.userreducer.organization;
  });
 useEffect(()=>{

 // const { route } = this.props;
  const { submissionId, slug,status } = props.route.params;

  firestore()
    .collection(`submissions_${orgSlug}`)
    .doc(slug).collection("submissionData").doc(submissionId)
    .get()
    .then(documentSnapshot => {
      if (documentSnapshot.exists) {
        const data = documentSnapshot.data();
        if(status=='Submitted'){
          setSubData(data.rawSubmission.data.__root);
        }
        else if(status=='Synced'){
          setSubData(data.data);
        }
        else{
          setSubData(data.rawSubmission.data.__root);
        }

      }
    });
 },[])

 

  makeArrayForTable = page =>
    page
      ? Object.entries(page).map(item => {
        var base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
        var check = base64regex.test(item[1]);

        // TRUE
        if (Array.isArray(item[1])) {
          return [item[0], JSON.stringify(item[1][0])];
        }
        if (typeof item[1] === 'object' && item[1]) {
          //alert('aa');
          return [item[0], JSON.stringify(item[1])];
        }

        if (item[1] === true) {
          item[1] = 'True';
        }
        if (item[1] === "false") {
          item[1] = 'False';
        }

        return item;
      })
      : null;

 
    

    if (!subData) {
      return (
        <View style={globalStyles.loaderScreenCentered}>
          <ActivityIndicator size="large" />
        </View>
      );
    }
    const tableHead = ['Key', 'Value'];
    const tableData = this.makeArrayForTable(subData);
    return (
      <ScrollView>
        <View style={globalStyles.scrollableTableContainer}>
          <Table borderStyle={styles.tableBorder}>
            <Row
              data={tableHead}
              style={styles.tableHead}
              textStyle={styles.tableText}
            />
            <Rows
              data={tableData}
              textStyle={styles.tableText}
            />
          </Table>
        </View>
      </ScrollView>
    );
  
}





export default SubmissionView;
