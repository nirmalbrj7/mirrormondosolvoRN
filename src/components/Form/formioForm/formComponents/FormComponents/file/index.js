import React from 'react';
import {
  TouchableOpacity,
  View,
  PixelRatio,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {Text, Icon} from 'react-native-elements/src/index';
import {connect} from 'react-redux';
import ImagePicker from 'react-native-image-picker';
import ProgressBarAnimated from 'react-native-progress-bar-animated';
import 'react-native-get-random-values';
import {v4 as uuidv4} from 'uuid';
import Colors from '../../../../../../constants/colors';

import InputComponent from '../sharedComponents/Input';
import uploadFile from './file.service';

const progressCustomStyles = {
  backgroundColor: Colors.SUCCESS_TEXT_COLOR,
  borderRadius: 0,
  height: 40,
  borderColor: Colors.INPUT_BORDER_COLOR,
};

const barWidth = Dimensions.get('screen').width - 30;

class File extends InputComponent {
  changeUploadProgress = val => {
    this.onChange({uploadProgress: val, uploading: true}, 'file');
  };

  clear = () => {
    this.onChange('', 'file');
  };

  selectPhotoTapped = () => {
    const options = {
      quality: 1.0,
      maxWidth: 500,
      maxHeight: 500,
      storageOptions: {
        skipBackup: true,
      },
    };

    ImagePicker.showImagePicker(options, response => {
      if (response.didCancel) {
        console.log('User cancelled photo picker');
      } else if (response.error) {
        alert(`ImagePicker Error: ${response.error}`);
        this.clear();
      } else if (response.customButton) {
        console.log('User tapped custom button: ', response.customButton);
      } else {
        const {
          component: {storage, url: urlStorage},
        } = this.props;
        const fileObject = {
          uri: response.uri,
          type: response.type,
          name: response.fileName || uuidv4(),
          data: response.data,
          storage,
        };
        uploadFile(fileObject, urlStorage, this.changeUploadProgress)
          .then(e => {
              console.log('TRIGGER BHAYO'+JSON.stringify(e));
            this.onChange(
              [
                {
                  storage,
                  name: response.fileName,
                  originalName: response.fileName,
                  url: e.url,
                  size: response.fileSize,
                  type: 'image/jpeg',
                },
              ],
              'file',
            );
          })
          .catch(e => {
            if (e.message === 'Network Error') {
              this.onChange(
                [
                  {
                    ...fileObject,
                    urlStorage,
                    notUpload: true,
                    storage,
                  },
                ],
                'file',
              );
              alert('Your file is not uploaded, but it is saved.');
              return;
            }
            alert(
              `${e.message} ${
                e.response && e.response.data
                  ? JSON.stringify(e.response.data)
                  : 'not response'
              } `,
            );
            if (e.message) {
              this.clear();
            }
          });
      }
    });
  };

  getSingleElement(value) {
    const {colors, theme} = this.props;
    const {item: {uploading = false, uploadProgress = 0} = {}, item} = value;
    return (
      <View
        style={[
          styles.container,
          {borderColor: colors.borderColor, lineHeight: theme.Input.lineHeight},
        ]}>
        {!uploading ? (
          <TouchableOpacity onPress={this.selectPhotoTapped}>
            <View style={styles.fileContainer}>
              {!item || !item.length ? (
                <Text style={styles.placeholder}>Select a Photo</Text>
              ) : (
                <View style={styles.fileContent}>
                  <Text
                    style={styles.fileName}
                    numberOfLines={1}
                    ellipsizeMode="middle">
                    {item[0].name}
                  </Text>
                  <TouchableOpacity onPress={this.clear}>
                    <Icon name="delete" color="red" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ) : (
          <ProgressBarAnimated
            {...progressCustomStyles}
            width={barWidth}
            value={uploadProgress}
          />
        )}
      </View>
    );
  }
}

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

const mapStateToProps = state => ({
  form: state.form.form,
});

export default connect(mapStateToProps)(File);