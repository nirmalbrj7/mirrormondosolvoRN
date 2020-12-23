import React, { useState,useEffect } from 'react';
import { View,Alert } from 'react-native';
import { List, Button, IconButton, Colors,Divider } from 'react-native-paper';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import NetInfo from "@react-native-community/netinfo";
import RNFetchBlob from 'rn-fetch-blob';
import { useSelector, useDispatch } from 'react-redux'
const Settings = () => {

var unsubscribe=null
    const currentUid = auth().currentUser.uid;
    const orgSlug = useSelector(state => {
      //console.log("STATE" + JSON.stringify(state.datagridreducer))
      return state.userreducer.organization;
    });
    const formRef = firestore().collection(`forms_${orgSlug}`).where('userIds', 'array-contains', currentUid);

    var FORMS_FOLDER = RNFetchBlob.fs.dirs.DownloadDir + '/bcforms/';



    useEffect(()=>{
        //return ()=>unsubscribe=null;
    },[])

    RNFetchBlob.fs.ls(FORMS_FOLDER).then(files => {
      console.log(files);
  
    }).catch(error => console.log(error))
  
    const actualRemove = (file,formSlug,formCreated,formLink) => {
      var FORMS_FOLDER = RNFetchBlob.fs.dirs.DownloadDir + '/bcforms/' + file;
      RNFetchBlob.fs.unlink(FORMS_FOLDER).then(() => {
        console.log("file deleted");
        actualDownload(formSlug,formCreated,formLink);
        // ...
      })
    }

 
  
    const actualDownload = (formSlug,formCreated,formLink) => {
      const { dirs } = RNFetchBlob.fs;
      RNFetchBlob.config({
        fileCache: true,
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          mediaScannable: true,
          title: `formSlug.json`,
          path: `${dirs.DownloadDir}/bcforms/${formSlug}_${formCreated}.json`,
        },
      })
        .fetch('GET', formLink, {})
        .then((res) => {
          console.log(JSON.stringify(res));
          console.log('The file saved to ', res.path());
        })
        .catch((e) => {
          console.log(e)
        });
    }
  
    const downloadFile = async () => {
  
  
      NetInfo.fetch().then(async (state) => {
        if (state.isConnected == true) {
          try {
            const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
              removeOldDownload();
            } else {
              Alert.alert('Permission Denied!', 'You need to give storage permission to download the file');
            }
          } catch (err) {
            console.warn(err);
          }
        }
        else {
          Alert.alert(
            "Connection Problem",
            "No Internet Connection.",
            [
  
              { text: "OK", onPress: () => console.log("OK Pressed") }
            ],
            { cancelable: false }
          );
        }
      });
  
  
  
  
    }


    const removeOldDownload = (formSlug,formCreated,formLink) => {
        var FORMS_FOLDER = RNFetchBlob.fs.dirs.DownloadDir + '/bcforms/';
        var file = formSlug;
        RNFetchBlob.fs.ls(FORMS_FOLDER).then(files => {
          console.log(files);
          const newData = files.filter(item => {
            return item.indexOf(file) > -1;
          });
          if (newData.length == 0) {
            actualDownload(formSlug,formCreated,formLink)
          }
          else {
            var fileToRemove = newData[0];
            actualRemove(fileToRemove,formSlug,formCreated,formLink);
          }
    
    
        }).catch(error => console.log(error))
    
    
    
    
    
        //  this.setState({ data: newData });  
    
    
    
      }

    const UpdateForms=()=>{
 
        NetInfo.fetch().then(async (state) => {
            if (state.isConnected == true) {

 unsubscribe =  formRef.onSnapshot(querySnapshot => {
            const form = [];
    
            querySnapshot.forEach(doc => {
                const {name, Icon, formEndpoint,form_link,slug,DateCreated} = doc.data();
                const formData=doc.data().form;
                const isLargeForm=doc.data().form==null?'true':'false';
                const formCreated = DateCreated._seconds;
                if(isLargeForm=='true'){
                    //remove
                    removeOldDownload(slug,formCreated,form_link);

                    //download
                }
            });
        });
        unsubscribe();
            }
            else{
                Alert.alert(
                    "Connection Problem",
                    "No Internet Connection.",
                    [
          
                      { text: "OK", onPress: () => console.log("OK Pressed") }
                    ],
                    { cancelable: false }
                  );
            }
        });





    }
    return (
        <View style={{ backgroundColor: '#fff', height: '100%' }}>
            <List.Section title="Forms">

                <List.Item
                    title="Update large Forms"

                    left={props => <List.Icon {...props} icon="form" />}
                    right={props => <IconButton
                        icon="sync"
                        color={Colors.blue500}
                        size={20}
                        style={{fontWeight:'bold'}}
                        onPress={() => UpdateForms()}
                    />}


                />
                <Divider />

            </List.Section>


        </View>

    );
}
export default Settings;