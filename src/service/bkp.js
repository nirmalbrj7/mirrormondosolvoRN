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


  const fullSubmission = _.cloneDeep(currentSubmission);
  fullSubmission.userId = currentUid;
  fullSubmission.status = status;
  fullSubmission.formId = currentFormId;
  fullSubmission.timestamp = firestore.Timestamp.now();
  delete fullSubmission.isNew;
  delete fullSubmission.submissionId;

  console.log("old");

  console.log('currentSlugId'+currentSlugId);
  console.log('submissionId'+submissionId);
  var date='kkkkkkkkkkk';
  const collectionRef = await firestore().collection('submissions').doc(currentSlugId).add({'sss':'sss'});
  const collectionRef2 = await firestore().collection('submissions').doc(currentSlugId).set({});
   const collectionRef3 =await firestore().collection('submissions').doc(currentSlugId)
     .collection("submissionData").doc(submissionId).update(fullSubmission);

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
