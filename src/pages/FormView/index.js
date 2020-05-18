import React from 'react';
import {Text, View,ScrollView} from 'react-native';
import {useSafeArea} from 'react-native-safe-area-context';
import {useSelector} from 'react-redux';
import PropTypes from 'prop-types';

import globalStyles from '../../globalStyles';
import styles from './style';

import FormFlowWizard from '../../components/Form';

const FormView = (props,navigation) => {
 // console.log("NAVIGATION"+JSON.stringify(props));
  
  const insets = useSafeArea();
  const inAppFormName = useSelector(state => state.form.inAppFormName);
   props.navigation.setOptions({ headerTitle: inAppFormName });
  
  return (
<ScrollView>
<View
      style={{
        ...globalStyles.screenContainer,
        paddingBottom: insets.bottom,
      }}>
       <FormFlowWizard />
    </View>
</ScrollView>
   
  );
};

FormView.propTypes = {
  inAppFormName: PropTypes.string,
  navigation: PropTypes.shape({}).isRequired,
};

FormView.defaultProps = {
  inAppFormName: '',
};

export default FormView;
