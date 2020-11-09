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
 // alert(JSON.stringify(fullSubmission));

/*  const submissionsListRef = firestore()
    .collection('submissions').doc(currentSlugId)
    .collection("submissionData");*/
  if (isSubmissionNew) {

    const document5 = await firestore().collection('submissions').doc(currentSlugId).collection("submissionData").doc();
    const documentId=await document5.id;

    firestore().collection('testcol2').doc(currentSlugId).collection("submissionData").doc(documentId).set(fullSubmission);
return documentId;
     
  } else {

    const document5 = await firestore().collection('submissions').doc(currentSlugId).collection("submissionData").doc(submissionId).set(fullSubmission);
   
     return submissionId;
    
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
