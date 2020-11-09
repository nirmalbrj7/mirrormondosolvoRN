import React from 'react';
import {View, ActivityIndicator, ScrollView} from 'react-native';
import {Table, Row, Cell, TableWrapper} from 'react-native-table-component';
import moment from 'moment';
import {Button} from 'react-native-elements';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

import globalStyles from '../../globalStyles';
import styles from './style';
import Background from '../../components/simple/Background';

export default class SectionGroups extends React.PureComponent {
  constructor(props) {
    super(props);

    const currentUid = auth().currentUser.uid;
    this.groupsListRef = firestore()
      .collection('users_in_groups')
      .where('userId', '==', currentUid);
    this.currentUserRef = firestore()
      .collection('users')
      .doc(currentUid);
  }

  state = {
    groups: null,
  };

  async componentDidMount() {
    this.groupsListUnsubscribe = this.groupsListRef.onSnapshot(
      this.onCollectionUpdate,
    );
    this.currentUserUnsubscribe = this.currentUserRef.onSnapshot(
      this.onCollectionUpdate,
    );
  }

  componentWillUnmount() {
    this.groupsListUnsubscribe();
    this.currentUserUnsubscribe();
  }

  onCollectionUpdate = () => {
    const currentUid = auth().currentUser.uid;

    let hiddenGroups;

    Promise.resolve()
      .then(() =>
        firestore()
          .collection('users')
          .doc(currentUid)
          .get(),
      )
      .then(docSnapshot => {
        hiddenGroups = docSnapshot.data().hiddenGroups;
        if (!Array.isArray(hiddenGroups)) {
          hiddenGroups = [];
        }
      })
      .then(() =>
        firestore()
          .collection('users_in_groups')
          .where('userId', '==', currentUid)
          .get(),
      )
      .then(querySnapshot => {
        const groupsIdDocs = [];
        querySnapshot.forEach(doc => {
          groupsIdDocs.push({
            usersInGroupsDocId: doc.id,
            ...doc.data(),
          });
        });
        return groupsIdDocs;
      })
      // Then, fetch data about each group by id's that we've got
      .then(groupsIds =>
        Promise.all([
          Promise.all(
            groupsIds.map(groupIdDoc =>
              firestore()
                .collection('groups')
                .doc(groupIdDoc.groupId)
                .get()
                .then(doc => {
                  const isHidden = hiddenGroups.some(
                    e => e === groupIdDoc.groupId,
                  );
                  return {
                    groupDetails: doc.data(),
                    isPublic: false,
                    dateJoined: groupIdDoc.dateJoined,
                    groupId: groupIdDoc.groupId,
                    isHidden,
                  };
                }),
            ),
          ),

          firestore()
            .collection('groups')
            .where('type', '==', 'Public')
            .get()
            .then(querySnapshot =>
              querySnapshot.docs.map(doc => {
                const isHidden = hiddenGroups.some(e => e === doc.id);
                return {
                  groupDetails: doc.data(),
                  isPublic: true,
                  groupId: doc.id,
                  isHidden,
                };
              }),
            ),
        ]),
      )
      .then(privateAndPublicDocSnapshotsList => {
        return privateAndPublicDocSnapshotsList[0].concat(
          privateAndPublicDocSnapshotsList[1],
        );
      })
      .then(values => {
        this.setState({groups: values});
      })
      .catch(err => {
        console.error(err);
      });
  };

  makeArrayForTable = groups =>
    groups &&
    groups.map(item => {
      const timestamp =
        item.dateJoined && item.dateJoined.seconds
          ? moment(item.dateJoined.seconds * 1000).format('L[\n]LTS')
          : 'Public group';

      return [
        timestamp,
        item.groupDetails.name,
        {
          // This one's for Leave button
          groupId: item.groupId,
          isHidden: item.isHidden,
        },
      ];
    });

  hideGroup = data => {
    const currentUid = auth().currentUser.uid;

    firestore()
      .collection('users')
      .doc(currentUid)
      .get()
      .then(docSnapshot => {
        const prevHiddenGroups = docSnapshot.data().hiddenGroups || [];

        let nextHiddenGroups;

        if (data.isHidden) {
          nextHiddenGroups = prevHiddenGroups.filter(el => el !== data.groupId);
        } else {
          nextHiddenGroups = prevHiddenGroups.concat(data.groupId);
        }

        firestore()
          .collection('users')
          .doc(currentUid)
          .update({
            hiddenGroups: nextHiddenGroups,
          });
      });
  };

  makeLeaveButtonInTable = data => (
    <Button
      title={data.isHidden ? 'Show' : 'Hide'}
      onPress={() => {
        this.hideGroup(data);
      }}
      buttonStyle={styles.inTableButton}
      titleStyle={styles.tableText}
    />
  );

  render() {
    const {groups} = this.state;

    if (!groups) {
      return <ActivityIndicator size="large" />;
    }

    const tableHead = ['Date Joined', 'Group Name', 'Actions'];
    const tableData = this.makeArrayForTable(groups);

    return (
      <ScrollView style={globalStyles.scrollableTableContainer}>
    
        {tableData && (
          <Table borderStyle={styles.tableBorder}>
            <Row
              data={tableHead}
              style={styles.tableHead}
              textStyle={styles.tableText}
            />
            {tableData.map((rowData, index) => (
              <TableWrapper key={index} style={styles.tableRow}>
                {rowData.map((cellData, cellIndex) => (
                  <Cell
                    textStyle={styles.tableText}
                    key={cellIndex}
                    data={
                      cellIndex === 2
                        ? this.makeLeaveButtonInTable(cellData)
                        : cellData
                    }
                  />
                ))}
              </TableWrapper>
            ))}
          </Table>
        )}
      </ScrollView>
    );
  }
}
