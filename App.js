import React from 'react';
import { View } from 'react-native';
import { Provider } from 'react-redux';
import commonStyles from './src/globalStyles';
import store from './src/store/store';
import AppContainer from './src/navigation';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AwesomeIcon from 'react-native-vector-icons/AntDesign';
import { Provider as PaperProvider } from 'react-native-paper';
import { ThemeProvider } from 'react-native-elements';
import SQLite from 'react-native-sqlite-storage';
const theme = {
  Button: {
    buttonStyle: {
      backgroundColor: '#600EE6'
    }
  },
};
global.db = SQLite.openDatabase(
  {
    name: "SQLite.db"
  },
  () => { },
  error => {
    console.log("ERROR: " + error);
  }
);

const App = () => {
  return (
    <Provider store={store}>
      <PaperProvider
        settings={{
          icon: props => <AwesomeIcon {...props} />,
        }}
      >
        <ThemeProvider theme={theme}>
          <View style={commonStyles.rootAppView}>
            <SafeAreaProvider>
              <AppContainer />
            </SafeAreaProvider>
          </View>
        </ThemeProvider>
      </PaperProvider>
    </Provider>
  );
};

export default App;
