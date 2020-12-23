import React from 'react';
import { Button as ButtonElement } from 'react-native-elements';
import auth from '@react-native-firebase/auth';
import PropTypes from 'prop-types';

import styles from '../style';
import { ActivityIndicator, ScrollView, Text, View, PermissionsAndroid, ToastAndroid, Alert } from 'react-native';
import { connect } from 'react-redux';
import RNFetchBlob from "rn-fetch-blob";
import RNFS from "react-native-fs";
import AsyncStorage from '@react-native-async-storage/async-storage'
import storage from '@react-native-firebase/storage';
import { Button } from 'react-native-paper';
import GetLocation from 'react-native-get-location'

import SQLite from 'react-native-sqlite-storage';

SQLite.DEBUG = true;
import { openDatabase } from 'react-native-sqlite-storage';
import firestore from '@react-native-firebase/firestore';
import { effectTypes } from 'redux-saga/effects';
//var db = openDatabase({ name: 'UserDatabase.db' });
class SyncButtonClass extends React.PureComponent {

  state = {
    loading: false,
  };

  ExecuteQuery = (sql, params = []) => new Promise((resolve, reject) => {
    db.transaction((trans) => {
      trans.executeSql(sql, params, (trans, results) => {
        resolve(results);
      },
        (error) => {
          reject(error);
        });
    });
  });

  CreateTable = async () => {
    let Table = await this.ExecuteQuery('CREATE TABLE IF NOT EXISTS table_user(file_id INTEGER PRIMARY KEY AUTOINCREMENT, submission_id INTEGER,source VARCHAR(25),file_array VARCHAR(5000))', []);
    console.log(Table);
 
  }
  componentDidMount = async () => {
    await this.CreateTable();
  }


  handleLogout = () => {
    const { navigation } = this.props;
    auth()
      .signOut()
      .then(() => navigation.navigate('SignIn'))
      .catch(error => {
        Alert.alert(error.message);
      });
  };






  deleteSQL = async (ID) => {
    /* db.transaction((tx) => {
       tx.executeSql(
         'DELETE FROM  table_user where file_id=?',
         [ID],
         (tx, results) => {
           console.log('Results', results.rowsAffected);
           if (results.rowsAffected > 0) {
             console.log("delted");
           } else {
             console.log("no valid id");
           }
         }
       );
     });*/

    let deleteQuery = await this.ExecuteQuery('DELETE FROM  table_user where file_id=?', [ID]);

    console.log(deleteQuery);
  }
  deleteFile = async (path) => {
    const { config, fs } = RNFetchBlob;
    const downloads = fs.dirs.DownloadDir;
    return (
      RNFS.unlink(path)
        .then(() => {
          console.log("FILE DELETED");
        })
        .catch(err => {
          console.log(err.message);
        })
    );
  }

  syncImage2 = async () => {
    const { config, fs } = RNFetchBlob;
    const downloads = fs.dirs.DownloadDir;
    const draftPath = fs.dirs.DownloadDir + "/" + downloads + "/" + "draft" + "/";
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {

        var exist = await RNFetchBlob.fs.isDir(draftPath);
        console.log("exist" + exist);
        if (exist == false) {
          await RNFetchBlob.fs.mkdir(draftPath);
        }

        if (exist == true) {
          console.log("Permission granted");

          let files2 = await RNFS.readDir(
            draftPath
          );

          if (files2.length > 0) {
            files2.map((val, index) => {

              storage()
                .ref(`forms_${this.props.orgSlug}`)
                .child(val.name)
                .putFile(val.path)
                .then((snapshot) => {
                  //You can check the image is now uploaded in the storage bucket
                  console.log(`${val.name} has been successfully uploaded.`);
                  this.deleteFile(val.name);
                  return snapshot;
                })
                .catch((e) => {
                  console.log('uploading image error => ', e)
                })

            })
          }

          console.log("found2:\t" + JSON.stringify(files2));

        }

      } else {
        console.log("Permission denied");
      }
    } catch (err) {
      console.warn(err);
    }
  }
  DeletLocalData = async (id) => {
    try {
      const offlineObject = await AsyncStorage.getItem('OfflineImage4')
      if (offlineObject !== null) {
        var oldObj = JSON.parse(offlineObject);
        var toreturn5 = oldObj.filter((post) => id !== post.Id)
        console.log("toreturn5" + JSON.stringify(toreturn5));
        await AsyncStorage.setItem("OfflineImage4", JSON.stringify(toreturn5))
      }
    } catch (e) {
      alert('Failed to fetch the data from storage')
    }
  }
  deleteFile = async (name) => {
    const { config, fs } = RNFetchBlob;
    const downloads = fs.dirs.DownloadDir;
    const draftPath = fs.dirs.DownloadDir + "/" + downloads + "/" + "draft" + "/";
    var path = draftPath;
    return (
      RNFS.unlink(path)
        .then(() => {
          console.log("FILE DELETED");
        })
        // `unlink` will throw an error, if the item to unlink does not exist
        .catch(err => {
          console.log(err.message);
        })
    );
  }

  UploadCloudFile = async (file, id, myObj) => {
    var file = file.file;
    const fileExtension = file.uri.split('.').pop();
    var storageRef = storage().ref(`files/images/${file.name}`);
    var success = false;
    try {
      const imageRef = storage().ref("form").child(file.name);
      await imageRef.putFile(file.uri).then((snapshot) => {
        if (snapshot.state == 'success') { success = true }
      });
      const url = await imageRef.getDownloadURL();
      if (url) {
        this.deleteFile(file.name);
        this.DeletLocalData(id);

        firestore()
          .collection('media')
          .add(myObj)
          .then(() => {
            console.log('media added!');
          });
      }
    }
    catch (e) {
      console.log(e);
    }
  }
  syncImage = async () => {
    try {
      const offlineObject = await AsyncStorage.getItem('OfflineImage4')
      if (offlineObject !== null) {
        var offlineObject2 = JSON.parse(offlineObject);
        offlineObject2.map(async (val, index) => {
          var myObject = {};
          myObject.formId = val.formId;
          myObject.componentkey = val.componentkey;
          myObject.mediaurl = val.uri;
          myObject.type = val.type;
          myObject.userId = val.currentUid;
          await this.UploadCloudFile(val, val.Id, myObject);
        });
      }
      else {
        alert("Already synced");
      }
    } catch (e) {
      alert('Failed to fetch the data from storage')
    }


  }


  syncBLOB = async () => {

    try {
      const offlineObject = await AsyncStorage.getItem('OfflineBLOB')
      if (offlineObject !== null) {
        var offlineObject2 = JSON.parse(offlineObject);
        offlineObject2.map(async (val, index) => {
          await this.UploadCloudFile2(val.file, val, val.file.type, val.myObject);
        });
      }
      else {
        alert("Already synced");
      }
    } catch (e) {
      alert('Failed to fetch the data from storage')
    }


  }
  saveLocalBLOB = async (obj, file) => {
    try {

      const offlineObject = await AsyncStorage.getItem('OfflineBLOB');

      const formId = this.props.form._id;
      const componentkey = this.props.component.key;
      const currentUid = auth().currentUser.uid;
      var myObject = {};
      myObject.formId = formId;
      myObject.componentkey = componentkey;
      myObject.mediaurl = file.uri;
      myObject.type = file.type;
      myObject.userId = currentUid;

      obj.myObject = myObject;

      if (offlineObject !== null) {
        var oldObj = JSON.parse(offlineObject);
        await AsyncStorage.setItem("OfflineBLOB", JSON.stringify([...oldObj, obj]))
        await this.UploadCloudFile2(file, obj, file.type, myObject);
        await this.readLocalBLOB();
      }
      else {
        await AsyncStorage.setItem("OfflineBLOB", JSON.stringify([obj]))
        await this.readLocalBLOB();
      }
    } catch (e) {
    }
  }



  DeletLocalBLOB = async (id) => {
    try {
      const offlineObject = await AsyncStorage.getItem('OfflineBLOB')
      if (offlineObject !== null) {
        var oldObj = JSON.parse(offlineObject);
        var toreturn5 = oldObj.filter((post) => id !== post.blobId)
        await AsyncStorage.setItem("OfflineBLOB", JSON.stringify([toreturn5]))
      }
    } catch (e) {
      alert('Failed to fetch the data from storage')
    }
  }
  readLocalBLOB = async () => {
    try {
      const offlineObject = await AsyncStorage.getItem('OfflineBLOB')
      if (offlineObject !== null) {
      }
    } catch (e) {
      alert('Failed to fetch the data from storage')
    }
  }

  blobToBase64 = blob => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    return new Promise(resolve => {
      reader.onloadend = () => {
        resolve(reader.result);
      };
    });
  };

  UploadCloudFile2 = async (file, blob, type, myObject) => {
    var blob2 = {};
    blob2._data = blob._data;
    try {
      const imageRef = storage().ref("form").child(file.name);
      blobToBase64(blob2).then(res => {
        // do what you wanna do
        // console.log('sssssss' + res); // res is base64 now
      });
      await imageRef.put(blob2).then((snapshot) => {
        // console.log("snapshot" + JSON.stringify(snapshot));
      });
      const url = await imageRef.getDownloadURL();
      if (url) {
        this.DeletLocalBLOB(blob2.blobId);
        firestore()
          .collection('media')
          .add(myObject)
          .then(() => {
            console.log('media added!');
          });
      }
    }
    catch (e) {
      console.log('error' + JSON.stringify(e));
    }
  }

  UploadCloudFile3 = async (file, blob, myObject, ID) => {
    try {
      const imageRef = storage().ref("form").child(file.name);
      await imageRef.putFile(myObject.mediaurl).then((snapshot) => {
        //console.log("snapshot" + JSON.stringify(snapshot));
      });
      const url = await imageRef.getDownloadURL();
      if (url) {
        this.deleteFile(myObject.mediaurl);
        this.deleteSQL(ID);
        firestore()
          .collection('media')
          .add(myObject)
          .then(() => {
            ToastAndroid.showWithGravityAndOffset(
              'Media added Sucessfully',
              ToastAndroid.LONG, //can be SHORT, LONG
              ToastAndroid.BOTTOM, //can be TOP, BOTTON, CENTER
              25, //xOffset
              50 //yOffset
            );

            console.log('media added!');
          });
      }
    }
    catch (e) {
      console.log(e);
    }
  }


  syncImage4 = async () => {
    console.log('eeee');
    this.setState({
      loading: 'sss'
    })
    console.log('ddd');




    /*  await db.transaction(async (tx) => {
        console.log('nnn');
        await tx.executeSql('SELECT * FROM table_user', [],
          async (tx, results) => {
            console.log(JSON.stringify(results));
            var len = results.rows.length;
            console.log('ccc'+len);
            if (len > 0) {
              let res = results.rows.item(0);
              for (let i = 0; i < len; i++) {
                let row = results.rows.item(i);
                var ID = row.file_id;
                var row2 = row.file_array;
                console.log(JSON.stringify(JSON.parse(row2)));
                var row3 = JSON.stringify(JSON.parse(row2)[0]);
                var row4 = JSON.parse(row3);
                var mediaUrl = row4.mediaUrl;
                const photoData = await fetch(row4.mediaurl);
                const blob = await photoData.blob();
                this.UploadClo=udFile3(row4.file, blob, row4, ID);
              }
  
              console.log(JSON.stringify(results));
              // updateAllStates(res.user_name, res.user_contact, res.user_address);
            } else {
              this.setState({
                loading:false
              })
              alert('Files are already synced');
              //updateAllStates('', '', '');
            }
          }
        );
      });*/

    let selectQuery = await this.ExecuteQuery("SELECT * FROM table_user", []);
    var rows = selectQuery.rows;
    var len = rows.length;


    if (len > 0) {
      let res = rows.item(0);
      for (let i = 0; i < len; i++) {
        let row = rows.item(i);
        var ID = row.file_id;
        var row2 = row.file_array;
        console.log(JSON.stringify(JSON.parse(row2)));
        var row3 = JSON.stringify(JSON.parse(row2)[0]);
        var row4 = JSON.parse(row3);
        var mediaUrl = row4.mediaUrl;

        console.log("AAAAAAAA"+JSON.stringify(row4));
        const photoData = await fetch(`file:///${row4.mediaurl}`);
        const blob = await photoData.blob();
        this.UploadCloudFile3(row4.file, blob, row4, ID);
      }

      console.log(JSON.stringify(rows));
      // updateAllStates(res.user_name, res.user_contact, res.user_address);
    } else {
      this.setState({
        loading: false
      })
      alert('Files are already synced');
      //updateAllStates('', '', '');
    }

    for (let i = 0; i < rows.length; i++) {
      var item = rows.item(i);
      console.log("sss" + item);
    }


    this.setState({
      loading: false
    })
  }

  syncImage3 = async () => {

    await db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM table_user', [],
        async (tx, results) => {
          console.log(JSON.stringify(results))
          var len = results.rows.length;
          if (len > 0) {
            let res = results.rows.item(0);
            for (let i = 0; i < len; i++) {
              let row = results.rows.item(i);
              //console.log(JSON.stringify(row));
            }

            console.log(JSON.stringify(results));
          } else {
            alert('No user found');
          }
        }
      );
    });
  }

  render() {
    return (
      <>

      {
        this.state.loading==false
        ?
        <ButtonElement
        icon={{
          name: 'sync',
          type: 'Ionicons',
          style: { marginRight: 0 },
        }}
        buttonStyle={{
          backgroundColor: '#fff'
        }}
        containerStyle={styles.buttonContainerNoPadding}
        iconContainerStyle={styles.buttonContainerNoPadding}
        onPress={async () => { console.log('ffff'), await this.syncImage4() }}
        type="clear"
      />
      :
      <ActivityIndicator size={24} color="#000" />
      }

      </>

    );
  }
}

SyncButtonClass.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }),
};
const mapStateToProps = state => ({
 // form: state.form.form,
  //submission: state.submission,
  orgSlug : state.userreducer.organization
});

export default connect(mapStateToProps)(SyncButtonClass);