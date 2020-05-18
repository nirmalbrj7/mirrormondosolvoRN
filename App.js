import React from 'react';
import {View} from 'react-native';
import {Provider} from 'react-redux';

import commonStyles from './src/globalStyles';

import store from './src/store/store';
import AppContainer from './src/navigation';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import AwesomeIcon from 'react-native-vector-icons/AntDesign';
import { Provider as PaperProvider } from 'react-native-paper';

import { ThemeProvider, Button } from 'react-native-elements';

const theme = {
  Button: {
    buttonStyle:{
      backgroundColor: '#600EE6' 
    }
   
  },
};
const App: () => React$Node = () => {
  return (
    
    <Provider store={store}>
      <ThemeProvider theme={theme}>
      <PaperProvider
        settings={{
          icon: props => <AwesomeIcon {...props} />,
        }}
       // theme={this.state.theme}
      >
      <View style={commonStyles.rootAppView}>
        <SafeAreaProvider>
          <AppContainer />
        </SafeAreaProvider>
      </View>



      </PaperProvider>

      </ThemeProvider>


     

    </Provider>
  );
};

export default App;
