import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import _ from 'lodash';

export function actualizeDataOnFirestore(currentSubmission, currentFormId, currentSlugId, status,) {
  const currentUid = auth().currentUser.uid;
  const isSubmissionNew = currentSubmission.isNew;
  const { submissionId: currentSubmissionId } = currentSubmission;

  const fullSubmission = _.cloneDeep(currentSubmission);
  fullSubmission.userId = currentUid;
  fullSubmission.status = status;
  fullSubmission.formId = currentFormId;
  fullSubmission.timestamp = firestore.Timestamp.now();
  delete fullSubmission.isNew;
  delete fullSubmission.submissionId;
  const collectionRef = firestore().collection('submissions').doc(currentSlugId)
    .collection("submissionData");
  const submissionsListRef = firestore()
    .collection('submissions').doc(currentSlugId)
    .collection("submissionData");
  if (isSubmissionNew) {
    const collectionRef2 = firestore().collection('submissions').doc(currentSlugId).set({});
    const collectionRef3 = firestore().collection('submissions').doc(currentSlugId)
      .collection("submissionData");
    collectionRef3.add(fullSubmission);
  } else {
    const collectionRef2 = firestore().collection('submissions').doc(currentSlugId).set({});
    const collectionRef3 = firestore().collection('submissions').doc(currentSlugId)
      .collection("submissionData");
    //collectionRef3.doc(currentSubmission.submissionId).set(fullSubmission);
    collectionRef3.doc(currentSubmission.submissionId).update(fullSubmission);
    return currentSubmissionId;
  }
  return snapshotPromise(submissionsListRef).then(doc => {
    const currentItem = doc.docChanges().reduce((acc, item) => {
      const {
        doc: { id },
      } = item;
      const currentTimestamp = item.doc.data().timestamp;
      let newAcc = acc;
      if (item.type === 'added' && currentTimestamp) {
        if (!newAcc) {
          newAcc = { ...currentTimestamp, id };
        }
        if (newAcc && newAcc.seconds < currentTimestamp.seconds) {
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

  });
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
