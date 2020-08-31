import { StyleSheet } from 'react-native';
import Colors from '../../constants/colors';
import Dimen from '../../constants/dimen';

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  textContainer: {
    alignSelf: 'flex-start',
    marginHorizontal: 10,
  },
  button: {
    margin: 20,
  },
  imageContainer: {
    width: Dimen.WINDOW_WIDTH,
    height: 315,
    padding: 25,
    backgroundColor: Colors.BASIC_IMAGE_CONTAINER_BACKGROUND_COLOR,
    alignItems: 'center',
  },
  image: {
    flex: 1,
    width: 300,
    marginBottom: 5,
  },
  textContainerTMP: {
    flexDirection: 'row',
    alignContent: 'center',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 15,
  },

});

export default styles;
