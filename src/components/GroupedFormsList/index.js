import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import PropTypes from 'prop-types';

import FormsGroup from './FormsGroup';
import styles from './style';

export default class GroupedFormsList extends React.PureComponent {
  constructor(props) {
    super(props);

    const currentUid = auth().currentUser.uid;

    this.usersInGroupsListRef = firestore()
      .collection('users_in_groups')
      .where('userId', '==', currentUid);
    this.groupsListRefPrivate = firestore()
      .collection('groups')
      .where('type', '==', 'Private');
    this.userDataRef = firestore()
      .collection('users')
      .doc(currentUid);
    this.groupsListRefPublic = firestore()
      .collection('groups')
      .where('type', '==', 'Public');
  }

  state = {
    privateGroups: [],
    publicGroups: [],
    loading: true,
  };

  componentDidMount() {
    this.usersInGroupsListUnsubscribe = this.usersInGroupsListRef.onSnapshot(
      this.onCollectionUpdatePrivate,
    );
    this.groupsListPrivateUnsubscribe = this.groupsListRefPrivate.onSnapshot(
      this.onCollectionUpdatePrivate,
    );
    this.userDataUnsubscribe = this.userDataRef.onSnapshot(
      this.onCollectionUpdateFull,
    );
    this.groupsListPublicUnsubscribe = this.groupsListRefPublic.onSnapshot(
      this.onCollectionUpdatePublic,
    );
  }

  componentWillUnmount() {
    this.usersInGroupsListUnsubscribe();
    this.groupsListPrivateUnsubscribe();
    this.userDataUnsubscribe();
    this.groupsListPublicUnsubscribe();
  }

  onCollectionUpdateFull = () => {
    this.onCollectionUpdatePublic();
    this.onCollectionUpdatePrivate();
  };

  onCollectionUpdatePrivate = () => {
    const currentUid = auth().currentUser.uid;

    let hiddenGroups;
    firestore()
      .collection('users')
      .doc(currentUid)
      .get()
      .then(userDataSnapshot => {
        //hiddenGroups = userDataSnapshot.data().hiddenGroups;
      })
      .then(() =>
        firestore()
          .collection('users_in_groups')
          .where('userId', '==', currentUid)
          .get(),
      )
      .then(querySnapshot => {
        const nonHiddenGroups = querySnapshot.docs.filter(group => {
          /* if (hiddenGroups) {
             return hiddenGroups.every(e => e !== group.data().groupId);
           }*/
          return true;
        });

        return Promise.all(
          nonHiddenGroups.map(usersInGroupsDoc => {
            const { groupId } = usersInGroupsDoc.data();
            return firestore()
              .collection('groups')
              .doc(groupId)
              .get()
              .then(doc => ({
                key: doc.id, // Document ID
                doc, // DocumentSnapshot
                ...doc.data(),
              }))
              .catch(e => console.log(e.message));
          }),
        );
      })
      .then(newPrivateGroups => {
        this.setState({
          privateGroups: newPrivateGroups,
          loading: false,
        });
      })
      .catch(e => console.log(e.message));
  };

  onCollectionUpdatePublic = () => {
    const currentUid = auth().currentUser.uid;
    const newPublicGroups = [];

    let hiddenGroups;
    firestore()
      .collection('users')
      .doc(currentUid)
      .get()
      .then(userDataSnapshot => {
        //hiddenGroups = userDataSnapshot.data().hiddenGroups;
      })
      .then(() =>
        firestore()
          .collection('groups')
          .where('type', '==', 'Public')
          .get(),
      )
      .then(querySnapshot => {
        const nonHiddenGroups = querySnapshot.docs.filter(group => {
          /* if (hiddenGroups) {
             return hiddenGroups.every(e => e !== group.id);
           }*/
          return true;
        });

        nonHiddenGroups.forEach(group =>
          newPublicGroups.push({
            key: group.id,
            doc: group,
            ...group.data(),
          }),
        );
        this.setState({
          publicGroups: newPublicGroups,
          loading: false,
        });
      });
  };

  render() {
    const { privateGroups, publicGroups, loading } = this.state;

    const groups = privateGroups.concat(publicGroups);
    const groupsOrdered = groups.sort((a, b) => a.orderNo - b.orderNo);

    const { handleFormsListItemPress } = this.props;

    if (loading) {
      return <ActivityIndicator size="large" />;
    }
    return (
      <View style={styles.groupsListContainer}>
        {groupsOrdered.map(group => (
          <FormsGroup
            key={group.key}
            group={group}
            handleFormsListItemPress={handleFormsListItemPress}
          />
        ))}
      </View>
    );
  }
}

GroupedFormsList.propTypes = {
  handleFormsListItemPress: PropTypes.func.isRequired,
};
