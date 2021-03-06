import React from 'react';


import { Button, Input, Icon } from 'react-native-elements/src/index';
import {
  TouchableOpacity,
  View,
  PixelRatio,
  StyleSheet,
  Dimensions,
  PermissionsAndroid, ToastAndroid, Text
} from 'react-native';
//import {  Icon } from 'react-native-elements/src/index';
import { connect } from 'react-redux';
import ImagePicker from 'react-native-image-picker';
import ProgressBarAnimated from 'react-native-progress-bar-animated';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import Colors from '../../../../../../constants/colors';
import auth from '@react-native-firebase/auth';
import InputComponent from '../sharedComponents/Input';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import RNFetchBlob from "rn-fetch-blob";
import RNFS from "react-native-fs";
import AsyncStorage from '@react-native-community/async-storage'
import DocumentPicker from "react-native-document-picker";
import NetInfo from "@react-native-community/netinfo";
import ImagePicker2 from "react-native-image-crop-picker";

import { openDatabase } from 'react-native-sqlite-storage';
import MultiComponent from '../sharedComponents/Multi';

var db = openDatabase({ name: 'UserDatabase.db' });

const progressCustomStyles = {
  backgroundColor: Colors.SUCCESS_TEXT_COLOR,
  borderRadius: 4,
  height: 5,
  borderColor: Colors.INPUT_BORDER_COLOR,
};
var no_of_uploads = 0;
const barWidth = Dimensions.get('screen').width - 100;
var ImageUpload = 0;
var FileUpload = 0;

class File extends MultiComponent {
  constructor(props) {
    super(props);
    this.getInitialValue = this.getInitialValue.bind(this);

    this.onConfirm = this.onConfirm.bind(this);

    this.getSingleElement = this.getSingleElement.bind(this);
  }

  getInitialValue(value) {
    if (!this.props) {
      return '';
    }
    if (value && value.item)
      return value.item;
  }


  onConfirm(value, index) {
    const selected = moment(value);
    const dateFormat = this.getResultFormat();
    if (selected.isValid()) {
      const date = selected.format(dateFormat).toString();
      this.setValue(date, index);
    } else {
      // this fixes date module returning invalid date
      // if confirm button was pressed without touching date picker.
      value = moment()
        .format(dateFormat)
        .toString();
      //  this.setValue(value.toISOString(), index);
    }
    this.setState({
      open: false,
    }, console.log("herecon" + this.state.open));
  }
  deleteUploading = async (id, docId, name, item) => {

    // alert("into delete");
    var componentkey = this.props.component.key;
    //    var componentData = this.props.data[componentkey];
    var documentId = docId;
    var documentName = name;
    var item = item;
    console.log("id" + id);
    console.log("docId" + docId);
    console.log("name" + name);


    var UploadingArray = [
      {
        "id": 1,
        "name": "file1",
        "url": "wwww.hheee",
        "uploading": true,
        "progress": 70
      },
      {
        "id": 2,
        "name": "file2",
        "url": "wwww.hheee",
        "uploading": true,
        "progress": 80
      }
    ]
    //  this.onChange(UploadingArray, 'file');

    //  changeUploadProgress(90);
    firestore()
      .collection('media')
      .doc(documentId)
      .delete()
      .then(() => {
        console.log('media firestore deleted!');
        if (item == true) {
          //alert('aaa'+JSON.stringify(this.state.value.item));
          let filteredArray = this.state.value.item.filter(item => item.id != id);
          //alert('filteredArray'+JSON.stringify(this.state.value));
          console.log('filteredArray' + JSON.stringify(filteredArray));
          this.setValue(filteredArray);
        }
        else if (item == false) {
          //alert('sss'+JSON.stringify(this.state.value.item));
          let filteredArray = this.state.value.item.filter(item => item.id != id)
          //alert('filteredArray'+JSON.stringify(this.state.value));
          console.log('filteredArray' + JSON.stringify(filteredArray));
          this.setValue(filteredArray);
        }
        else {

        }

        //this.onChange(filteredArray, 'file');
        // Create a reference to the file to delete
        // var desertRef = firebase.storage().child('images/example.jpg');
        const imageRef = storage().ref("form").child(documentName);
        // Delete the file
        imageRef.delete().then(function () {
          console.log('media cloud storgae deleted!');
          console.log("this.data1" + JSON.stringify(this.props.data));
          // console.log("this.data"+JSON.stringify(componentData));
          // File deleted successfully

          //alert(JSON.stringify(filteredArray));
          // componentData = filteredArray;

        }).catch(function (error) {
          // Uh-oh, an error occurred!
        });
      });


  }

  /***SQL */
  saveSQL = async (myarray) => {
    console.log("save sql");
    db.transaction(function (txn) {
      txn.executeSql(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='table_user'",
        [],
        function (tx, res) {
          console.log('item:', res.rows.length);
          if (res.rows.length == 0) {
            txn.executeSql('DROP TABLE IF EXISTS table_user', []);
            txn.executeSql(
              'CREATE TABLE IF NOT EXISTS table_user(file_id INTEGER PRIMARY KEY AUTOINCREMENT, file_array VARCHAR(5000))',
              []
            );
          }
        }
      );
    });
    console.log("here");

    db.transaction(function (tx) {

      tx.executeSql(
        'INSERT INTO table_user (file_array) VALUES (?)',
        [JSON.stringify(myarray)],
        (tx, results) => {
          console.log('Results', results.rowsAffected);
          if (results.rowsAffected > 0) {
            // alert("ssssssss");
          } else alert('Registration Failed');
        }
      );
    });
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM table_user', [],
        (tx, results) => {
          var len = results.rows.length;
          if (len > 0) {
            let res = results.rows.item(0);
            for (let i = 0; i < len; i++) {
              let row = results.rows.item(i);
              console.log(JSON.stringify(row));
              //this.setState({record: row.name});
            }

            console.log(JSON.stringify(results));
            // updateAllStates(res.user_name, res.user_contact, res.user_address);
          } else {
            alert('No user found');
            //updateAllStates('', '', '');
          }
        }
      );
    });

  }


  /**BLOB */
  blobToBase64 = blob => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    return new Promise(resolve => {
      reader.onloadend = () => {
        resolve(reader.result);
      };
    });
  };



  /**
   * 
  ASYNCSTORAGE 
   */
  async componentDidMount() {
    try {
      const offlineObject = await AsyncStorage.getItem('OfflineImage4')

      if (offlineObject !== null) {
      }
      else {
        await AsyncStorage.setItem('OfflineImage4', '[]').then(async () => {

        });
      }
    }
    catch (e) {

    }
  }



  changeUploadProgress = val => {
    this.onChange({ uploadProgress: val, uploading: true }, 'file');
  };

  clear = () => {
    this.onChange('', 'file');
  };

  deleteFile = async (name) => {
    const { config, fs } = RNFetchBlob;
    const downloads = fs.dirs.DownloadDir;
    const draftPath = fs.dirs.DownloadDir + "/" + downloads + "/" + "draft" + "/";
    var path = draftPath;
    return (
      RNFS.unlink(path)
        .then(() => {
          console.log("FILE DELETED");
          //this.readFiles();
        })
        // `unlink` will throw an error, if the item to unlink does not exist
        .catch(err => {
          console.log(err.message);
        })
    );
  }
  readFile = async () => {
    console.log("=====================================================");
    console.log("=====================================================");
    console.log("=====================================================");

    const { config, fs } = RNFetchBlob;
    const downloads = fs.dirs.DownloadDir;
    const draftPath = fs.dirs.DownloadDir + "/" + downloads + "/" + "draft" + "/";
    RNFS.readDir(RNFS.DocumentDirectoryPath + "/" + downloads + "/" + "draft" + "/") // On Android, use "RNFS.DocumentDirectoryPath" (MainBundlePath is not defined)
      .then((result) => {
        console.log('GOT RESULT', result);

        // stat the first file
        return Promise.all([RNFS.stat(result[0].path), result[0].path]);
      })
      .then((statResult) => {
        if (statResult[0].isFile()) {
          // if we have a file, read it
          return RNFS.readFile(statResult[1], 'utf8');
        }

        return 'no file';
      })
      .then((contents) => {
        // log the file contents
        console.log(contents);
      })
      .catch((err) => {
        console.log(err.message, err.code);
      });
    console.log("=====================================================");
    console.log("=====================================================");
    console.log("=====================================================");
  };


  UploadCloudFile3 = async (file, blob, myObject) => {

    console.log("upclf2blob" + JSON.stringify(blob));
    //var componentkey = this.props.component.key;
    //var componentData = this.props.data[componentkey];
    var ExistingData = this.state.value;
    if (!ExistingData || ExistingData == '') {
      //this.onChange([], 'file');
      this.setValue([]);
    }




    var fullpath = null;


    const imageRef = storage().ref("form").child(file.name);

    const RandVal = Math.random();


    // var aaa = this.props.data[componentkey]
    try {
      const imageRef = storage().ref("form").child(file.name);
      await imageRef.put(blob).then((snapshot) => {
        console.log("snapshot" + JSON.stringify(snapshot));
        console.log("progress: " + (snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        const progressBar = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        fullpath = 'gs://formbuilder-e5062.appspot.com/' + snapshot.metadata.fullPath;
        var newArray = [
          {
            "id": RandVal,
            "name": file.name,
            "url": "wwww.hheee",
            "uploading": true,
            "progress": 80
          }
        ];

        console.log("this.state.value" + JSON.stringify(this.state.value));
        var mergeData = [...this.state.value.item, ...newArray];
        //var mergeData =newArray;
        console.log("merge" + JSON.stringify(mergeData));
        // this.onChange(mergeData, 'file');
        this.setValue(mergeData);


      });


















      const url = await imageRef.getDownloadURL();
      console.log("file" + url);
      if (url) {
        //gs://formbuilder-e5062.appspot.com/form/dd851442-0a18-45f7-bbed-fd83b22c9ea0

        myObject.mediaurl = fullpath;
        firestore()
          .collection('media')
          .add(myObject)
          .then((docRef) => {
            console.log("Doc REF" + JSON.stringify(docRef.id));
            ToastAndroid.showWithGravityAndOffset(
              'Media added Sucessfully',
              ToastAndroid.LONG, //can be SHORT, LONG
              ToastAndroid.BOTTOM, //can be TOP, BOTTON, CENTER
              25, //xOffset 
              50 //yOffset
            );

            var data = [...this.state.value.item];
            var index = data.findIndex(obj => obj.id === RandVal);
            data[index].url = fullpath;
            data[index].uploading = false;
            data[index].firebaseDocId = docRef.id

            //this.onChange(data, 'file');
            this.setValue(data);


            console.log('media added!');
          });
      }
    }
    catch (e) {
      console.log(e);
    }
  }


  CopyFile2 = async (title, url, file) => {
    console.log("file" + JSON.stringify(file));
    console.log("title" + JSON.stringify(title));
    console.log("url" + JSON.stringify(url));
    // console.log("file"+JSON.stringify(file));
    const fileurl = url;
    const filename = title;
    const { config, fs } = RNFetchBlob;
    const downloads = fs.dirs.DownloadDir;

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("Permission granted");
        console.log(fs.dirs.DownloadDir + "/" + downloads + "/" + "draft" + "/");
        var exist = await RNFetchBlob.fs.isDir(
          fs.dirs.DownloadDir + "/" + downloads + "/" + "draft" + "/"
        );
        console.log("exist" + exist);
        if (exist == false) {
          await RNFetchBlob.fs.mkdir(
            fs.dirs.DownloadDir + "/" + downloads + "/" + "draft" + "/"
          );
        }
        const pictureFolder = fs.dirs.DownloadDir + "/" + downloads + "/" + "draft" + "/";
        const formId = this.props.form._id;
        const componentkey = this.props.component.key;
        const currentUid = auth().currentUser.uid;
        var myObject = {};
        myObject.formId = formId;
        myObject.componentkey = componentkey;
        myObject.mediaurl = url;
        myObject.type = "image";
        myObject.userId = currentUid;
        myObject.Id = uuidv4();
        myObject.name = file.name;
        // alert(uuidv4());
        RNFS.copyFile(fileurl, `${pictureFolder}/${title}`)
          .then(async () => {

            delete myObject.mediaurl;
            myObject.mediaurl = `${pictureFolder}/${title}`;
            console.log("copy");

            console.log(`${pictureFolder}${title}`);
            const photoData = await fetch(`${pictureFolder}${title}`);
            console.log('photoData' + photoData);
            const blob = await photoData.blob();
            // await this.saveLocalData(myObject,file);
            console.log("AFETR COPY" + JSON.stringify(blob));

            //return true;
            // await this.readFiles();
          }).catch((err) => {
            console.log("err" + JSON.stringify(err));
            console.warn(err);
            return false;
          });


      } else {
        return false;
      }
    } catch (err) {
      console.warn(err);
      return false;
    }
  };
  CopyFile = async (title, url, file) => {
    console.log("file" + JSON.stringify(file));
    console.log("title" + JSON.stringify(title));
    console.log("url" + JSON.stringify(url));
    // console.log("file"+JSON.stringify(file));
    const fileurl = url;
    const filename = title;
    const { config, fs } = RNFetchBlob;
    const downloads = fs.dirs.DownloadDir;
    var mediaArray = [];
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("Permission granted");
        console.log(fs.dirs.DownloadDir + "/" + downloads + "/" + "draft" + "/");
        var exist = await RNFetchBlob.fs.isDir(
          fs.dirs.DownloadDir + "/" + downloads + "/" + "draft" + "/"
        );
        console.log("exist" + exist);
        if (exist == false) {
          await RNFetchBlob.fs.mkdir(
            fs.dirs.DownloadDir + "/" + downloads + "/" + "draft" + "/"
          );
        }
        const pictureFolder = fs.dirs.DownloadDir + "/" + downloads + "/" + "draft" + "/";
        console.log(`aa${pictureFolder}${title}`);
        const formId = this.props.form._id;
        const componentkey = this.props.component.key;
        const currentUid = auth().currentUser.uid;
        var myObject = {};
        myObject.formId = formId;
        myObject.componentkey = componentkey;
        myObject.mediaurl = url;
        myObject.type = "image";
        myObject.userId = currentUid;
        myObject.Id = uuidv4();
        myObject.name = file.name;
        myObject.file = file;
        // alert(uuidv4());

        RNFS.copyFile(fileurl, `${pictureFolder}${title}`)
          .then(async () => {

            delete myObject.mediaurl;
            myObject.mediaurl = `${pictureFolder}${title}`;
            console.log("copy");
            const photoData = await fetch(`file://${pictureFolder}/${title}`);
            const blob = await photoData.blob();
            //await this.saveLocalData(myObject,file);
            mediaArray.push(myObject);


            console.log("mediaArrat" + JSON.stringify(mediaArray));
            // this.saveLocalData2(mediaArray);
            await this.saveSQL(mediaArray);

            console.log("AFETR COPY" + JSON.stringify(blob));

            //return true;
            // await this.readFiles();
          }).catch((err) => {
            console.log("err" + JSON.stringify(err));
            console.warn(err);
            return false;
          });


      } else {
        return false;
      }
    } catch (err) {
      //  console.warn(err);
      //return false;
    }
  };

  selectFileTappedSingle = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        try {
          const response = await DocumentPicker.pick({
            type: [DocumentPicker.types.allFiles],
          });
          const { component: { storage, url: urlStorage }, } = this.props;

          /** creating object */
          const fileObject = {
            uri: response.uri,
            type: response.type,
            name: response.fileName || uuidv4(),
            storage,
          };

          /**creating blob */
          const photoData = await fetch(response.uri);
          const blob = await photoData.blob();



          NetInfo.fetch().then(async (state) => {
            if (state.isConnected == true) {
              /**uploading */

              const formId = this.props.form._id;
              const componentkey = this.props.component.key;
              const currentUid = auth().currentUser.uid;
              const subId = this.props.submission.submissionId;

              var myObject = {};
              myObject.formId = formId;
              myObject.componentkey = componentkey;
              myObject.mediaurl = fileObject.uri;
              myObject.type = fileObject.type;
              myObject.userId = currentUid;
              myObject.file = fileObject;
              myObject.submissionId = subId;
              await this.UploadCloudFile3(fileObject, blob, myObject);
            }
            else {


              const { config, fs } = RNFetchBlob;
              const downloads = fs.dirs.DownloadDir;

              this.blobToBase64(blob).then(res => {
                //var Base64Code = base64Image.split("data:image/png;base64,"); //base64Image is my image base64 string                 
                var Base64Code = res.split("data:" + response.type + ";base64,");
                const type = res.split(';')[0].split('/')[1];
                const dirs = RNFetchBlob.fs.dirs;
                var path = dirs.DCIMDir + "/" + fileObject.name;

                const imagePath = `${RNFS.TemporaryDirectoryPath}${fileObject.name}.${type}`;
                RNFS.writeFile(imagePath, Base64Code[0], 'base64')
                  .then(async () => {
                    console.log('Image converted to jpg and saved at ' + imagePath);
                    var mediaArray = [];
                    const pictureFolder = fs.dirs.DownloadDir + "/" + downloads + "/" + "draft" + "/";
                    console.log(`aa${pictureFolder}${fileObject.name}`);
                    const formId = this.props.form._id;
                    const componentkey = this.props.component.key;
                    const currentUid = auth().currentUser.uid;



                    const subId = this.props.submission.submissionId;



                    var myObject = {};
                    myObject.formId = formId;
                    myObject.componentkey = componentkey;
                    myObject.mediaurl = 'file://' + imagePath;
                    myObject.type = fileObject.type;
                    myObject.userId = currentUid;
                    myObject.Id = uuidv4();
                    myObject.name = fileObject.name;
                    myObject.file = fileObject;
                    myObject.submissionId = subId;
                    mediaArray.push(myObject)
                    await this.saveSQL(mediaArray);

                  });
              });
            }
          });








        } catch (e) {
          console.log("Document Picker Error" + e);
        }
      }
      else {
        console.log("permission not granted");
      }

    }
    catch (e) {
      console.log("Main try catch" + JSON.stringify(e));
    }
  };

  getPermission = async (permission) => {
    let alreadyGranted = await PermissionsAndroid.check(permission);
    let requestGranted = '';
    if (!alreadyGranted) {
      requestGranted = await PermissionsAndroid.request(permission);
    }
    if (alreadyGranted || requestGranted === PermissionsAndroid.RESULTS.GRANTED) {
      return true;
    }
    return false;
  }

  selectFileTappedMultiple = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        try {
          const result = await DocumentPicker.pickMultiple({
            type: DocumentPicker.types.pdf,
            copyTo: "documentDirectory"
          });










          const { component: { storage, url: urlStorage }, } = this.props;

          let resultData = await Promise.all(result.map(async response => {



            const fileObject = {
              uri: response.uri,
              type: response.type,
              name: response.fileName || uuidv4(),
              storage,
            };
            const photoData = await fetch(response.uri)
            const blob = await photoData.blob();
            NetInfo.fetch().then(async (state) => {
              if (state.isConnected == true) {
                //await this.saveLocalBLOB(blob, fileObject);



                const subId = this.props.submission.submissionId;





                const formId = this.props.form._id;
                const componentkey = this.props.component.key;
                const currentUid = auth().currentUser.uid;
                var myObject = {};
                myObject.formId = formId;
                myObject.componentkey = componentkey;
                myObject.mediaurl = fileObject.uri;
                myObject.type = fileObject.type;
                myObject.userId = currentUid;
                myObject.file = fileObject;
                myObject.submissionId = subId;
                await this.UploadCloudFile3(fileObject, blob, myObject);

              }
              else {


                const { config, fs } = RNFetchBlob;
                const downloads = fs.dirs.DownloadDir;

                this.blobToBase64(blob).then(res => {
                  //var Base64Code = base64Image.split("data:image/png;base64,"); //base64Image is my image base64 string                 
                  var Base64Code = res.split("data:" + response.type + ";base64,");
                  const type = res.split(';')[0].split('/')[1];
                  const dirs = RNFetchBlob.fs.dirs;
                  var path = dirs.DCIMDir + "/" + fileObject.name;

                  const imagePath = `${RNFS.TemporaryDirectoryPath}${fileObject.name}.${type}`;
                  RNFS.writeFile(imagePath, Base64Code[0], 'base64')
                    .then(async () => {
                      console.log('Image converted to jpg and saved at ' + imagePath);
                      var mediaArray = [];
                      const pictureFolder = fs.dirs.DownloadDir + "/" + downloads + "/" + "draft" + "/";
                      console.log(`aa${pictureFolder}${fileObject.name}`);
                      const formId = this.props.form._id;
                      const componentkey = this.props.component.key;
                      const currentUid = auth().currentUser.uid;
                      const subId = this.props.submission.submissionId;
                      var myObject = {};
                      myObject.formId = formId;
                      myObject.componentkey = componentkey;
                      myObject.mediaurl = 'file://' + imagePath;
                      myObject.type = fileObject.type;
                      myObject.userId = currentUid;
                      myObject.Id = uuidv4();
                      myObject.name = fileObject.name;
                      myObject.file = fileObject;
                      myObject.submissionId = subId;

                      mediaArray.push(myObject)
                      await this.saveSQL(mediaArray);

                    });
                });
              }
            });
          }));






        } catch (e) {
          console.log("Document Picker Error" + e);
        }
      }
      else {
        console.log("permission not granted");
      }

    }
    catch (e) {
      console.log("Main try catch" + JSON.stringify(e));
    }
  }

  selectPhotoTapped = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        const options = {
          quality: 1.0,
          maxWidth: 500,
          maxHeight: 500,
          storageOptions: {
            skipBackup: true,
          },
        };

        ImagePicker.showImagePicker(options, async (response) => {

          if (response.didCancel) {
            console.log('User cancelled photo picker');
          } else if (response.error) {
            alert(`ImagePicker Error: ${response.error}`);
            this.clear();
          } else if (response.customButton) {
            console.log('User tapped custom button: ', response.customButton);
          } else {
            const {
              component: { storage, url: urlStorage },
            } = this.props;
            const fileObject = {
              uri: response.uri,
              type: response.type,
              name: response.fileName || uuidv4(),
              data: response.data,
              storage,
            };
            NetInfo.fetch().then(async (state) => {
              if (state.isConnected == true) {

                /**creating blob */
                const photoData = await fetch(response.uri)
                const blob = await photoData.blob();
                console.log("blob" + JSON.stringify(blob));
                /**uploading */
                //  this.saveLocalBLOB(blob, fileObject);


                const subId = this.props.submission.submissionId;
                const formId = this.props.form._id;
                const componentkey = this.props.component.key;
                const currentUid = auth().currentUser.uid;
                var myObject = {};
                myObject.formId = formId;
                myObject.componentkey = componentkey;
                myObject.mediaurl = fileObject.uri;
                myObject.type = fileObject.type;
                myObject.userId = currentUid;
                myObject.file = fileObject;
                myObject.submissionId = subId;
                await this.UploadCloudFile3(fileObject, blob, myObject);

              }
              else {

                var copyResult = await this.CopyFile(fileObject.name, fileObject.uri, fileObject);
              }

            });

          }
        });
      }
      else {
        alert('Permission Denied');
      }
    }
    catch (e) {

    }


  };
  selectPhotoTappedMultiple = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        ImagePicker2.openPicker({

          width: 300,
          height: 400,
          cropping: false,
          multiple: true,
          waitAnimationEnd: false,
          includeExif: true,
          forceJpg: false,
          maxFiles: 5
        })
          .then(async (result) => {
            console.log("IMAGE" + JSON.stringify(result));
            const {
              component: { storage, url: urlStorage },
            } = this.props;
            let resultImageData = await Promise.all(result.map(async response => {
              console.log("HERE");

              const fileObject = {
                uri: response.path,
                type: response.mime,
                name: uuidv4(),
                storage,
              };
              NetInfo.fetch().then(async (state) => {
                if (state.isConnected == true) {

                  /**creating blob */
                  const photoData = await fetch(response.path)
                  const blob = await photoData.blob();
                  console.log("blob" + JSON.stringify(blob));
                  /**uploading */
                  //this.saveLocalBLOB(blob, fileObject);

                  const subId = this.props.submission.submissionId;

                  const formId = this.props.form._id;
                  const componentkey = this.props.component.key;
                  const currentUid = auth().currentUser.uid;
                  var myObject = {};
                  myObject.formId = formId;
                  myObject.componentkey = componentkey;
                  myObject.mediaurl = fileObject.uri;
                  myObject.type = fileObject.type;
                  myObject.userId = currentUid;
                  myObject.file = fileObject;
                  myObject.submissionId = subId;

                  await this.UploadCloudFile3(fileObject, blob, myObject);
                }
                else {

                  var copyResult = await this.CopyFile(fileObject.name, fileObject.uri, fileObject);
                }

              });



              //  this.UploadCloudFile2(fileObject, blob, response.type);

              // console.log("fileobk"+JSON.stringify(fileObject));
              // await this.CopyFile(fileObject.name, response.path, fileObject);
              /* await this.CopyFile(fileObject.name, response.path, fileObject);*/


            })
            );


          })



        /* const fileObject = {
           uri: response.uri,
           type: response.type,
           name: response.fileName || uuidv4(),
           data: response.data,
           storage,
         };
         var copyResult = 'aaa';
         console.log("response.uri" + JSON.stringify(response.uri));
         copyResult = await this.CopyFile(response.fileName, response.uri, fileObject);
         console.log("copyresilt" + copyResult);*/


        // this.onChangeInput(images);
        /* this.setState({
           itemcount:images.length
         })*/
        /*ToastAndroid.showWithGravity(
          images.length+ 'images uploaded',
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
        );*/
        /*  this.setState({
        image: null,
        images: images.map(i => {
          console.log('received image', i);
          return {uri: i.path, width: i.width, height: i.height, mime: i.mime};
        })
      });*/

      }
      else {
        alert('Permission Denied');
      }
    }
    catch (e) {

    }



  };

  getSingleElement(value, index) {
    // const { component, name, readOnly } = this.props;
    const { component, name, readOnly, colors, theme, } = this.props;



    // var componentKey = this.props.component.key;
    //var componentData = this.props.data? this.props.data[componentKey]? this.props.data[componentKey]:null:null;
    const imageOrFile = component.image;//true if image
    const singleOrMultiple = component.multiple;//true if multiple
    console.log("aaaaaaaa");

    const Label =
      imageOrFile == true ?
        singleOrMultiple == true ? "Select Images" :
          "Select a Image"
        :
        singleOrMultiple == true ? "Select Files" :
          "Select a File";
    const Fieldlabel = component.label;
    const ExistingData = this.state.value;
    const ExistingDataItem = this.state.value.item;
    return (
      <View
        style={[
          styles.container,
          { marginLeft: 15, marginRight: 15, borderColor: colors.borderColor, lineHeight: theme.Input.lineHeight },
        ]}>


        <View>


          <TouchableOpacity onPress={() =>
            imageOrFile == true ?
              singleOrMultiple == true ? this.selectPhotoTappedMultiple() :
                this.selectPhotoTapped()
              :
              singleOrMultiple == true ? this.selectFileTappedMultiple() :
                this.selectFileTappedSingle()
          }>
            <View style={styles.fileContainer}>
              <Text style={styles.placeholder}>{Label}</Text>

            </View>

          </TouchableOpacity>
        </View>


        {
          ExistingData && !ExistingDataItem && ExistingData != '' && ExistingData.length > 0 ?
            ExistingData.map((val, index) => {
              {
                return (<>





                  <Text>{val.name}</Text>
                  <Text>{val.uploading}</Text>
                  <View style={{ flex: 1, flexDirection: 'row' }}>
                    <ProgressBarAnimated
                      {...progressCustomStyles}
                      width={barWidth}
                      value={100}
                    />
                    <Icon
                      //raised
                      name='trash'
                      type='font-awesome'
                      color='#f50'
                      onPress={async () => {

                        await this.deleteUploading(val.id, val.firebaseDocId, val.name, false)
                      }} />

                  </View>

                </>)
              }

            })
            :
            null
        }

        {
          ExistingData && ExistingDataItem && ExistingDataItem != '' && ExistingDataItem.length > 0 ?
            ExistingDataItem.map((val, index) => {
              {
                return (<>



                  <Text>{val.name}</Text>
                  <Text>{val.uploading}</Text>
                  <View style={{ flex: 1, flexDirection: 'row' }}>
                    <ProgressBarAnimated
                      {...progressCustomStyles}
                      width={barWidth}
                      value={100}
                    />
                    <Icon
                      //raised
                      name='trash'
                      type='font-awesome'
                      color='#f50'
                      onPress={async () => {

                        await this.deleteUploading(val.id, val.firebaseDocId, val.name, true)
                      }} />

                  </View>

                </>)
              }

            })
            :
            null
        }
      </View>


    );
  }
}
const mapStateToProps = state => ({
  form: state.form.form,
  submission: state.submission
});

export default connect(mapStateToProps)(File);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 15,
  },
  fileContainer: {
    borderColor: Colors.INPUT_BORDER_COLOR,
    borderWidth: 1 / PixelRatio.get(),
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    height: 40,
  },
  file: {
    width: '100%',
  },
  fileName: {
    width: '80%',
  },
  label: {
    marginBottom: 10,
  },
  placeholder: {
    paddingHorizontal: 10,
  },
  fileContent: {
    display: 'flex',
    flexDirection: 'row',
    paddingHorizontal: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  deleteButton: {
    borderRadius: 75,
    height: 20,
    width: 20,
  },
});
