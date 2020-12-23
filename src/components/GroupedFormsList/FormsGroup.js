import React from 'react';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {ActivityIndicator, Text, View} from 'react-native';
import PropTypes from 'prop-types';
import commonStyles from '../../globalStyles';
import styles from './style';
import FormsListItem from './FormListItem';
import {FETCHABLE_DATA_STATUS} from '../../constants/values';
import StoreActionsUser from '../../store/actions/user';
import { connect } from 'react-redux';
class FormsGroupClass extends React.Component {
  constructor(props) {
    super(props);
    this.formsCollectionRef = null;  
  }
  state = {
    forms: [],
    status: FETCHABLE_DATA_STATUS.LOADING,
  };

  componentDidMount() {
    const {userDta} = this.props;
   
    const currentUid = auth().currentUser.uid;
    this.formsCollectionRef = firestore()
      .collection(`forms_${userDta}`)
      .where('userIds', 'array-contains', currentUid);
    this.formsListUnsubscribe = this.formsCollectionRef.onSnapshot(
      this.onCollectionUpdate,
    );
  }

  componentWillUnmount() {
    this.formsListUnsubscribe();
  }

  onCollectionUpdate = () => {
    const {group,userDta} = this.props;

    const forms = [];
    const currentUid = auth().currentUser.uid;
    firestore()
      .collection(`forms_${userDta}`)
      .where('userIds', 'array-contains', currentUid)
      .get()
      .then(querySnapshot => {
        querySnapshot.forEach(doc => {
          const { name, Icon, formEndpoint, form_link, slug, DateCreated } = doc.data();
          const formData = doc.data().form;
          const isLargeForm = doc.data().form == null ? 'true' : 'false';
          forms.push({
            key: doc.id, // Document ID
            doc, // DocumentSnapshot
            name,
            Icon,
            formEndpoint,
            form_link,
            isLargeForm,
            slug,
            DateCreated,
            form: formData
          });
        });
        let status;
        if (!forms.length) {
          status = FETCHABLE_DATA_STATUS.EMPTY;
        } else {
          status = FETCHABLE_DATA_STATUS.SUCCESS;
        }
        this.setState({
          forms,
          status,
        });
      });
  };

  getGroupContent = status => {
    const {forms} = this.state;
    const {handleFormsListItemPress} = this.props;
    const formsOrdered = forms.sort((a, b) => a.orderNo - b.orderNo);

    switch (status) {
      case FETCHABLE_DATA_STATUS.LOADING: {
        return <ActivityIndicator size="small" color="purple" />;
      }
      case FETCHABLE_DATA_STATUS.EMPTY: {
      return<><Text>No forms here</Text></>;
      }
      case FETCHABLE_DATA_STATUS.SUCCESS: {
        return (
          <View style={styles.formsListContainer}>
            {formsOrdered.map(form => (
              <FormsListItem
                key={form.key}
                form={form}
                onPress={handleFormsListItemPress}
              />
            ))}
          </View>
        );
      }
      default:
        return <View />;
    }
  };

  render() {
    const {status} = this.state;
  

    return (
      <View style={styles.groupsListItemContainer}>
        {
          /**
           *  <Text style={commonStyles.header2}>{name}</Text>
           * 
           */
        }
       
        {this.getGroupContent(status)}
      </View>
    );
  }
}


function mapStateToProps(state) {
  const { userreducer } = state;
  console.log('user'+JSON.stringify(userreducer))
  return { userDta: userreducer.organization }
}

const FormsGroup = connect(

  mapStateToProps,
 null,
)(FormsGroupClass);

export default FormsGroup;
FormsGroup.propTypes = {
  group: PropTypes.shape({
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    forms: PropTypes.objectOf(
      PropTypes.shape({
        value: PropTypes.string.isRequired,
      }),
    ),
    type: PropTypes.string.isRequired,
  }).isRequired,

  handleFormsListItemPress: PropTypes.func.isRequired,
};
