import React, { useState } from 'react';
import { View, Text, PermissionsAndroid, Alert,ToastAndroid } from 'react-native';
import PropTypes from 'prop-types';
import { Avatar, Card, IconButton, Colors, Title } from 'react-native-paper';
import RNFetchBlob from 'rn-fetch-blob'
import NetInfo from "@react-native-community/netinfo";
import moment from 'moment';

function FormsListItem(props) {
  const { onPress, form, form_link } = props;
  const formLink = form.form_link;
  const isLargeForm = form.isLargeForm;
  const formSlug = form.slug;
  const formCreated = form.DateCreated._seconds;
  const [update, setUpdate] = useState(null);

  const LeftContent = props => <Avatar.Icon {...props} icon="form" key={Math.random()} style={{ backgroundColor: '#FF6347' }} color="#fff" />
  const rightContent = props => {

    //var newVersion = searchVersion();


    var FORMS_FOLDER = RNFetchBlob.fs.dirs.DownloadDir + '/bcforms/';
    var file = formSlug;
    var bool = '22222';
    RNFetchBlob.fs.ls(FORMS_FOLDER).then(files => {
      console.log(files);
      console.log("filecreated" + formCreated);
      var newData = aaa(files, file);

      if (newData.length == 0) {
        setUpdate('true');

      }
      else {
        var fileToRemove = newData[0];
        var res = fileToRemove.split("_");
        console.log("res" + res);
        if (res[1] == formCreated) {
          setUpdate('true');
        }
        else {
          setUpdate('false');
        }
      }
      //console.log("bool" + bool);
      // return bool;

    }).catch(error => console.log(error))


    return (
      <>
        <IconButton
          icon="clouddownloado"
          color={update == 'true' ? Colors.blue400 : Colors.green400}
          size={25}
          key={Math.random()}
          onPress={async () => {

            //DownloadJson(formLink) 
            await downloadFile()
          }}
        />

      </>
    )
  }

  const aaa = (files, file) => {
    const newData = files.filter(item => {
      return item.indexOf(file) > -1;

    });
    return newData;
  }


  var FORMS_FOLDER = RNFetchBlob.fs.dirs.DownloadDir + '/bcforms/';

  RNFetchBlob.fs.ls(FORMS_FOLDER).then(files => {
    console.log(files);

  }).catch(error => console.log(error))

  const actualRemove = async (file) => {
    var FORMS_FOLDER = RNFetchBlob.fs.dirs.DownloadDir + '/bcforms/' + file;
    RNFetchBlob.fs.unlink(FORMS_FOLDER).then(async () => {
      console.log("file deleted");
      await actualDownload();
      // ...
    })
  }
  const searchVersion = () => {

    var FORMS_FOLDER = RNFetchBlob.fs.dirs.DownloadDir + '/bcforms/';
    var file = formSlug;
    var bool = '11111111';
    RNFetchBlob.fs.ls(FORMS_FOLDER).then(files => {
      console.log(files);
      console.log("filecreated" + formCreated);
      const newData = files.filter(item => {
        return item.indexOf(file) > -1;

      });

      if (newData.length == 0) {
        console.log("filecreated11111111" + formCreated);
        bool = 'true';
      }
      else {
        var fileToRemove = newData[0];
        var res = fileToRemove.split("_");
        console.log("res" + res);
        if (res[1] == formCreated) {
          bool = 'true';
        }
        else {
          bool = 'false';
        }
      }
      console.log("bool" + bool);
      return bool;

    }).catch(error => console.log(error))
  }
  const removeOldDownload = async () => {


    try {

      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {

        var FORMS_FOLDER = RNFetchBlob.fs.dirs.DownloadDir + '/bcforms/';

        RNFetchBlob.fs.isDir(FORMS_FOLDER)
          .then((isDir) => {
            console.log(`file is ${isDir ? '' : 'not'} a directory`)
            if (isDir) {
              var FORMS_FOLDER = RNFetchBlob.fs.dirs.DownloadDir + '/bcforms/';
              var file = formSlug;
              RNFetchBlob.fs.ls(FORMS_FOLDER).then(async files => {
                console.log(files);
                const newData = files.filter(item => {
                  return item.indexOf(file) > -1;
                });
                if (newData.length == 0) {
                  await actualDownload()
                }
                else {
                  var fileToRemove = newData[0];
                  actualRemove(fileToRemove);
                }


              }).catch(error => console.log(error))


            }
            else {
              RNFetchBlob.fs.mkdir(FORMS_FOLDER)
                .then(async (res) => {

                  await actualDownload();
                });

            }
          })


      }
      else {
        alert("permission denied:write");
      }
    }
    catch (e) {
      console.log(e);
    }










    //  this.setState({ data: newData });  



  }

  const actualDownload = async () => {

    try {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {

        const { dirs } = RNFetchBlob.fs;




















        RNFetchBlob.config({
          fileCache: true,
          addAndroidDownloads: {
            useDownloadManager: true,
            mime: 'application/json',
            notification: true,
            mediaScannable: true,
            title: `${formSlug}_${formCreated}.json`,
            path: `${dirs.DownloadDir}/bcforms/${formSlug}_${formCreated}.json`,
          },
        })
          .fetch('GET', formLink, {})
          .then((res) => {
            Alert.alert(
              "Download",
              "Your Form has been downloaded.",
             
            );
            console.log(JSON.stringify(res));
            console.log('The file saved to ', res.path());
          })
          .catch((e) => {
            console.log(e)
          });
      } else {
        Alert.alert('Permission Denied!', 'You need to give storage permission to view the file');
      }
    } catch (err) {

      console.log(err);
    }


  }

  const downloadFile = async () => {


    NetInfo.fetch().then(async (state) => {
      if (state.isConnected == true) {
        ToastAndroid.showWithGravityAndOffset(
          "Form is being downloaded",
          ToastAndroid.LONG,
          ToastAndroid.BOTTOM,
          25,
          50
        );
       
        try {
          const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            //actualDownload();

            await removeOldDownload();
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

  return (
    <View style={{ backgroundColor: '#F4F4F4' }}>

      <Card
        key={Math.random()}

        onPress={() => { onPress(form); }} style={{
          paddingVertical: 5,
          marginBottom: 15,
          marginHorizontal: 10,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 10,
          borderBottomRightRadius: 10,
          borderBottomLeftRadius: 0,

          paddingRight: 10,
          borderLeftWidth: 5,
          borderLeftColor: '#600EE6',

        }}>
        <Card.Title
          key={Math.random()}
          title={form.name}
          subtitle={moment(form.DateCreated._seconds * 1000).format('L[:]LTS')}
          left={LeftContent} right={isLargeForm == 'true' ? rightContent : null} 
          titleStyle={{ fontSize: 17, fontFamily: 'sans-serif-light', fontWeight: 'bold' }} />
      </Card>

    </View>

  );
}

FormsListItem.propTypes = {
  onPress: PropTypes.func.isRequired,
  form: PropTypes.shape({
    name: PropTypes.string.isRequired,
    Icon: PropTypes.string,
  }).isRequired,
};

export default FormsListItem;