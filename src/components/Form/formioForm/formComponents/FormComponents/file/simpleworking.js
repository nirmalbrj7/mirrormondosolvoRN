
import React from 'react';
import DateTimePicker from 'react-native-modal-datetime-picker';
import { View, Text,StyleSheet,PixelRatio,TouchableOpacity,  Dimensions,
  PermissionsAndroid, ToastAndroid } from 'react-native';
import { Button, Input ,Icon} from 'react-native-elements/src/index';
import { connect } from 'react-redux';
import moment from 'moment';
//import Icon from 'react-native-vector-icons/FontAwesome5';
//import styles from './styles';
import MultiComponent from '../sharedComponents/Multi';
import ImagePicker from 'react-native-image-picker';
import { Value } from 'react-native-reanimated';
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
import AsyncStorage from '@react-native-async-storage/async-storage'
import DocumentPicker from "react-native-document-picker";
import NetInfo from "@react-native-community/netinfo";
import ImagePicker2 from "react-native-image-crop-picker";

import { openDatabase } from 'react-native-sqlite-storage';


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

 class File extends InputComponent {
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
  selectPhotoTapped() {
    const options = {
      quality: 1.0,
      maxWidth: 500,
      maxHeight: 500,
      storageOptions: {
        skipBackup: true,
      },
    };

    ImagePicker.showImagePicker(options, response => {
      console.log('Response = ', response);

      if (response.didCancel) {
        console.log('User cancelled photo picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else if (response.customButton) {
        console.log('User tapped custom button: ', response.customButton);
      } else {
        let source = {uri: response.uri};

        // You can also display the image using data:
        // let source = { uri: 'data:image/jpeg;base64,' + response.data };

        this.setValue(source);
      }
    });
  }

  getSingleElement(value, index) {
    const { component, name, readOnly } = this.props;

    return (
      <View style={{}}>

<TouchableOpacity onPress={this.selectPhotoTapped.bind(this)}>
          <View
            style={[styles.avatar, styles.avatarContainer, {marginBottom: 20}]}>
<Text>aaa{JSON.stringify(value)}</Text>
          </View>
        </TouchableOpacity>
        <Text>ss{JSON.stringify(this.state.value.item)}</Text>
        <Input
          placeholder="Comment"
          leftIcon={{ type: 'font-awesome', name: 'comment' }}
          //style={styles}
          style={{width:500}}
          value={this.state.value && this.state.value.item ? this.state.value.item : null}
          onChangeText={value => this.setValue(value)}
        />
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








  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  avatarContainer: {
    borderColor: '#9B9B9B',
    borderWidth: 1 / PixelRatio.get(),
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    borderRadius: 75,
    width: 150,
    height: 150,
  },
});
