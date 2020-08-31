import axios from 'axios';
import storage from '@react-native-firebase/storage';
import{
PermissionsAndroid
} from 'react-native';

import RNFetchBlob from "rn-fetch-blob";
import RNFS from "react-native-fs";
const deleteFile = async (name) => {
  const { config, fs } = RNFetchBlob;
  const downloads = fs.dirs.DownloadDir;
  const draftPath = fs.dirs.DownloadDir + "/" + downloads + "/" + "draft" + "/";
  var path =draftPath;
  return (
    RNFS.unlink(path)
      .then(() => {
        console.log("FILE DELETED");
        this.readFiles();
      })
      // `unlink` will throw an error, if the item to unlink does not exist
      .catch(err => {
        console.log(err.message);
      })
  );
}
const uploadFile = (file, url, callback) => {
  console.log("====================================================");
  console.log("====================================================");
  console.log("====================================================");
console.log("REQ IMAGES im");
  console.log("====================================================");
  console.log("====================================================");
  console.log("====================================================");
  const data = new FormData();
  data.append('file', file);
  data.append('dir', '');
  data.append('name', file.name);
  console.log("data"+JSON.stringify(data));
 // const url2="https://edatos.drcmp.org/api/fileUpload";

 /* return storage()
  
  .ref("form")
  .child(file.name)
  .putFile(file.uri)
  .then((snapshot) => {
    //You can check the image is now uploaded in the storage bucket
    console.log(`${file.name} has been successfully uploaded.`);
    deleteFile(file.name);
    return snapshot;
  })
  .catch((e) =>{ console.log('uploading image error => ', e)

  throw e;
});*/



if (file.uri) {
  const fileExtension = file.uri.split('.').pop();
  console.log("EXT: " + fileExtension);

  //var uuid = uuidv4();

  //const fileName = `${uuid}.${fileExtension}`;
  //console.log(fileName);

  var storageRef = firebase.storage().ref(`files/images/${file.name}`);

  return storageRef.putFile(file.imageUri)
    .on(
      firebase.storage.TaskEvent.STATE_CHANGED,
      snapshot => {
        console.log("snapshot: " + snapshot.state);
        console.log("progress: " + (snapshot.bytesTransferred / snapshot.totalBytes) * 100);

        if (snapshot.state === firebase.storage.TaskState.SUCCESS) {
          console.log("Success");
          deleteFile(file.name);
          return snapshot;

        }
      },
      error => {
        unsubscribe();
        console.log("image upload error: " + error.toString());
        throw error.toString();
      },
      () => {
        storageRef.getDownloadURL()
          .then((downloadUrl) => {
           /* console.log("File available at: " + downloadUrl);

            file.image = downloadUrl;

            delete file.imageUri;

            if (updating) {
              console.log("Updating....");
              updatefile(file, onfileUploaded);
            } else {
              console.log("adding...");
              addfile(file, onfileUploaded);
            }*/
          })
      }
    )
}




  /*return axios
    .post(url2, data, {
      headers: {'Content-Type': 'multipart/form-data'},
      onUploadProgress: progressEvent => {
        callback(
          parseInt(
            Math.round((progressEvent.loaded * 100) / progressEvent.total),
            10,
          ),
        );
      },
    })
    .then(response => {
      
      console.log("IMAGE RESPONSE"+JSON.stringify(response));
     return response.data;
    })
    .catch(response => {
      console.log("IMAGE ERROR RESPONSE"+response);
      throw response;
    });*/
};

export default uploadFile;