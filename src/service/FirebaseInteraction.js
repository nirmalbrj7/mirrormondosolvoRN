import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import _ from 'lodash';
import { Alert } from 'react-native';
import Actions from '../store/actions/submission';
export async function  actualizeDataOnFirestore(currentSubmission, currentFormId, currentSlugId, status) {
  const currentUid = auth().currentUser.uid;
  const isSubmissionNew = currentSubmission.isNew;
  const { submissionId, currentSubmissionId } = currentSubmission;



  console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
  console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
  console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");

 // console.log("CUUREEE"+JSON.stringify(submissionId));
 // console.log("currentFormId"+JSON.stringify(currentFormId));
 // console.log("currentSlugId"+JSON.stringify(currentSlugId));
  const fullSubmission = _.cloneDeep(currentSubmission);
  fullSubmission.userId = currentUid;
  fullSubmission.status = status;
  fullSubmission.formId = currentFormId;
  fullSubmission.timestamp = firestore.Timestamp.now();
  delete fullSubmission.isNew;
  delete fullSubmission.submissionId;

/*  const submissionsListRef = firestore()
    .collection('submissions').doc(currentSlugId)
    .collection("submissionData");*/
  if (isSubmissionNew) {
    //alert(JSON.stringify(fullSubmission));
    /*const collectionRef2 = firestore().collection('submissions').doc(currentSlugId).set({})
    .then(function (docRef) {
      console.log("Document written with ID2: ", JSON.stringify(docRef));
   }).catch(function (error) {
      console.error("Error adding document: ", error);
   });*/
console.log("NEW");
    var date='rrrrrrrrrrr';
   const collectionRef2 = await firestore().collection('submissions').doc(currentSlugId).set({});
    const collectionRef3 =await firestore().collection('submissions').doc(currentSlugId)
      .collection("submissionData").add(fullSubmission)
      .then(async function (docRef) {
        console.log("Document written with ID: ", docRef.id);
        date=docRef.id;
        console.log("2222: ", date);
      //  return "pppp";
       // return docRef.id;
     }).catch(function (error) {
        console.error("Error adding document: ", error);
     });
   /* collectionRef3.add(fullSubmission).then(ref => {
      alert("ref"+JSON.stringify(ref.status))
     });*/
    // if(date!=''){
      //return "qqqqqqqq";s
     //}
     return date;
     
  } else {
    console.log("old");

    console.log('currentSlugId'+currentSlugId);
    console.log('submissionId'+submissionId);
    var date='kkkkkkkkkkk';
    const collectionRef2 = await firestore().collection('submissions').doc(currentSlugId).set({});
     const collectionRef3 =await firestore().collection('submissions').doc(currentSlugId)
       .collection("submissionData").doc(submissionId).update(fullSubmission);
       /*.then(async function (docRef) {
         console.log("Document written with ID: ", docRef.id);
         date=docRef.id;
         console.log("2222: ", date);
       //  return "pppp";
        // return docRef.id;
      }).catch(function (error) {
         console.error("Error adding document: ", error);
      });*/
    /* collectionRef3.add(fullSubmission).then(ref => {
       alert("ref"+JSON.stringify(ref.status))
      });*/
     // if(date!=''){
       //return "qqqqqqqq";s
      //}
     // return date;
    
  }
  /*return snapshotPromise(submissionsListRef).then(doc => {
    const currentItem = doc.docChanges().reduce((acc, item) => {
      const {
        doc: { id },
      } = item;

      console.log("ITEM"+JSON.stringify(id));
      console.log("ITEM"+JSON.stringify(item.type));
      const currentTimestamp = item.doc.data().timestamp;
      let newAcc = acc;
      if (item.type === 'added' && currentTimestamp) {
        if (!newAcc) {
          console.log("ITEM111"+JSON.stringify(id));
          newAcc = { ...currentTimestamp, id };
        }
        if (newAcc && newAcc.seconds < currentTimestamp.seconds) {
          console.log("ITEM222"+JSON.stringify(id));
          newAcc = { ...currentTimestamp, id };
        }
      }
      return newAcc;
    }, null);
    if (currentItem && currentItem.id) {
      return currentItem.id;
    }
    else {
      return true;
    }

  });*/
}

export function fetchSubmissionData(submissionId, slug) {
  return firestore().collection('submissions').doc(slug)
    .collection("submissionData").doc(submissionId)
    .get()
    .then(docSnapshot => docSnapshot.data());
}
function snapshotPromise(ref) {
  return new Promise((resolve, reject) => {
    const unsubscribe = ref.onSnapshot(
      doc => {
        resolve(doc);
        unsubscribe();
      },
      error => {
        reject(error);
      },
    );
  });
}
