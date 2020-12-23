import {StyleSheet} from 'react-native';
import DeviceInfo from 'react-native-device-info';

const isTablet = DeviceInfo.isTablet();

const border = '#000033';

const styles = StyleSheet.create({
  signatureWrapper: {
    marginTop: 10,
  },
  imageWrapper: {
    marginTop: 10,
  },
  signatureButton: {
    width: 250,
    marginTop: isTablet ? 0 : 10,
    marginHorizontal: 0,
    paddingHorizontal: 0,
    alignSelf:'center',
    borderRadius:6
  },
  signature: {
    marginLeft: 10,
    width: 300,
    height: 150,
    flex: 1,
    padding: 15,
    backgroundColor:'red',
   // borderWidth:1,
   // borderColor:'#000',
    borderRadius:4,
    marginBottom:5,
    marginHorizontal:5,
    shadowColor: "#000",
shadowOffset: {
width: 0,
height: 2,
},
shadowOpacity: 0.25,
shadowRadius: 3.84,

//elevation: 5,
    
  },
  signaturePadWrapper: {
    flex: 1,
  },
  buttonWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signaturePad: {
    flex: 1,
    borderColor: border,
    borderWidth: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: 5,
  },
  modalFooterText: {
    fontSize: 18,
    marginLeft: 20,
  },



  preview: {
    height: 114,
    backgroundColor: "#F8F8F8",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
    flex: 1,
  },
  previewText: {
    color: "#FFF",
    fontSize: 14,
    height: 40,
    lineHeight: 40,
    paddingLeft: 10,
    paddingRight: 10,
    backgroundColor: "#69B2FF",
    width: 120,
    textAlign: "center",
    marginTop: 10
  }
});

export default styles;
