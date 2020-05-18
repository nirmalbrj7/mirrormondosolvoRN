import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import _ from 'lodash';

export function actualizeDataOnFirestore(
  currentSubmission,
  currentFormId,
  status,
) {
  const currentUid = auth().currentUser.uid;
  const isSubmissionNew = currentSubmission.isNew;
  const {submissionId: currentSubmissionId} = currentSubmission;

  const fullSubmission = _.cloneDeep(currentSubmission);
  fullSubmission.userId = currentUid;
  fullSubmission.status = status;
  fullSubmission.formId = currentFormId;
  fullSubmission.timestamp = firestore.Timestamp.now();
  delete fullSubmission.isNew;
  delete fullSubmission.submissionId;

  const collectionRef = firestore().collection('submissions');
  const submissionsListRef = firestore()
    .collection('submissions')
    .where('userId', '==', currentUid);
  if (isSubmissionNew) {
    collectionRef.add(fullSubmission);
  } else {
    collectionRef.doc(currentSubmission.submissionId).set(fullSubmission);
    return currentSubmissionId;
  }
  return snapshotPromise(submissionsListRef).then(doc => {
    const currentItem = doc.docChanges().reduce((acc, item) => {
      const {
        doc: {id},
      } = item;
      const currentTimestamp = item.doc.data().timestamp;
      let newAcc = acc;
      if (item.type === 'added' && currentTimestamp) {
        if (!newAcc) {
          newAcc = {...currentTimestamp, id};
        }
        if (newAcc && newAcc.seconds < currentTimestamp.seconds) {
          newAcc = {...currentTimestamp, id};
        }
      }
      return newAcc;
    }, null);
    return currentItem.id;
  });
}

export function fetchSubmissionData(submissionId) {
  return firestore()
    .collection('submissions')
    .doc(submissionId)
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
