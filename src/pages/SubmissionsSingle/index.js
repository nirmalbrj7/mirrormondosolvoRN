import React, { useState, useEffect, useContext, useCallback } from 'react';
import firestore from '@react-native-firebase/firestore';
import { connect } from 'react-redux';
import { useIsFocused } from "@react-navigation/native";
import { Text, View, FlatList, StyleSheet, ToastAndroid, ActivityIndicator, RefreshControl } from 'react-native';
import { Button } from 'react-native-elements';
import {
    Modal, Portal, Button as ButtonPaper, Provider,
    Chip, Title,
    Avatar, Card as CardPaper, Paragraph, List,
    IconButton, Colors
} from 'react-native-paper';
import Icons from 'react-native-vector-icons/AntDesign';
import IconsFontisto from 'react-native-vector-icons/Fontisto';
import moment from 'moment';
import SingleSubmissionContext from '../../store/context/singlesubmission';
import StoreActionsForm from '../../store/actions/form';
import StoreActionsSubmission from '../../store/actions/submission';




const Submissions = (props) => {
    const isFocused = useIsFocused();
    const formId = useContext(SingleSubmissionContext);
    const routeName = props.route.name;

    const [isLoading, setLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(false);

    const [formName, setFormName] = useState(null);
    const [formEndpoint, setFormEndpoint] = useState(null);
    const [formData, setFormData] = useState(null);

    //submission count
    const [count, setCount] = useState(0);
    const [currentSelectedSubmission, setCurrentSelectedSubmission] = useState(null);
    const [submissions, setSubmissions] = useState([]);

    const formRef = firestore().collection('forms').where('slug', '==', formId);
    const SubmissionRef = firestore().collection('submissions')
        .doc(formId)
        .collection('submissionData')
        .where('status', '==', routeName);

    const [visible, setVisible] = React.useState(false);

    const showModal = () => setVisible(true);

    const hideModal = () => setVisible(false);



    useEffect(() => {
        if (isFocused) {
            fetchData();
        }

    }, [isFocused]);
    const fetchData = () => {
        setIsFetching(true);
        setSubmissions([]);
        formRef.onSnapshot(querySnapshot => {
            querySnapshot.forEach(doc => {
                const { name, formEndpoint, form } = doc.data();
                setFormName(name);
                setFormEndpoint(formEndpoint);
                setFormData(form);
            });
        });
        SubmissionRef
            .get()
            .then(querySnapshot => {
                setCount(querySnapshot.size);
                const list = [];
                querySnapshot.forEach(async documentSnapshot => {
                    const { timestamp } = documentSnapshot.data();
                    list.push({
                        submissionId: documentSnapshot.id,
                        timestamp
                    });
                });
                setSubmissions(list);
                setIsFetching(false);
                if (isLoading) {
                    setLoading(false);

                }
            });
    }


    const _renderItem = ({ item }) => {
        const timestamp =
            item.timestamp && item.timestamp.seconds
                ? moment(item.timestamp.seconds * 1000).format('L[:]LTS')
                : 'Unknown';
        const submissionId = item.submissionId;
        return (
            <>
                <CardPaper
                    elevation={5}
                    style={{ margin: 10, borderRadius: 5, padding: 0, borderLeftWidth: 5, borderLeftColor: 'skyblue' }}
                >
                    <CardPaper.Title style={styles.cardWrapper}
                        title={formName}
                        titleStyle={{ fontSize: 16 }}

                        right={(props) => <View style={{ flex: 1, flexDirection: 'row' }}>
{
routeName == 'Incomplete' || routeName == 'Ready' ?

                            <IconButton
                                icon="delete"
                                color={Colors.red500}
                                size={20}
                                onPress={() => {
                                    setCurrentSelectedSubmission(submissionId);
                                    setVisible(true);
                                    // bs.current.snapTo(0)
                                }}
                            />
:null
                            }
                            <IconButton
                                icon="filter"
                                color='gray'
                                size={20}
                                onPress={() => {
                                    setCurrentSelectedSubmission(submissionId);

                                    // bs.current.snapTo(0)
                                }}
                            />


                        </View>
                        }
                    />



                    <CardPaper.Content>


                        <View style={{
                            flex: 1, flexDirection: 'row',
                            // alignContent:'space-between',
                            justifyContent: 'space-between',
                            marginTop: -15

                        }}>
                            <Text style={styles.dateWrapper}>
                                <IconsFontisto name="date" size={16} color="#000" />
                                <Text style={styles.date}>{' '}{timestamp}</Text>
                            </Text>
                            {makeSubmissionActionButton(submissionId)}

                        </View>
                        <View style={{
                            flex: 1, flexDirection: 'row',
                            alignContent: 'space-between',
                            justifyContent: 'space-between',

                        }}>
                            <Chip icon="tag" style={{backgroundColor:'#D7F5F3'}} >{routeName}</Chip>
                            {
                                currentSelectedSubmission == submissionId ?
                                    <Icons name="checkcircleo" size={20} color="green" style={styles.centerText} />
                                    :
                                    null
                            }


                        </View>


                        {
                            currentSelectedSubmission == submissionId && (routeName == 'Incomplete' || routeName == 'Ready' || routeName == 'Submitted')
                                ?
                                <Text style={styles.submission}>Id:{submissionId}</Text>
                                :
                                null
                        }



                    </CardPaper.Content>


                </CardPaper>


            </>
        );
    };

    const keyExtractor = useCallback((item) => item.submissionId, []);
    const ITEM_HEIGHT = 200;
    const getItemLayout = useCallback((data, index) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index,
    }), []);

    const makeSubmissionActionButton = (submissionId) => {
        const {
            navigation,
            tryUpdateCurrentForm,
            setCurrentFormData,
            updateFirebaseSubmissionId,
            fetchSubmissionDataFromCloud,
        } = props;
        let buttonTitle;
        switch (routeName) {

            case 'Incomplete':
                buttonTitle = 'Continue';
                break;
            case 'Submitted':
                buttonTitle = 'View';
                break;
            case 'Ready':
                buttonTitle = 'Submit';
                break;
            case 'Uploading':
                buttonTitle = 'Uploading...';
                break;
            case 'Synced':
                buttonTitle = 'View';
                break;
            default:
                buttonTitle = 'No action';
        }

        let onPressCallback;
        switch (routeName) {
            case 'Incomplete':
                onPressCallback = () => {
  
                    navigation.navigate('FormView');
                    tryUpdateCurrentForm({
                        form: formData,
                        formEndpoint: formEndpoint,
                    });
                    setCurrentFormData(formName, formId, formData.datagrid, formId);
                    updateFirebaseSubmissionId(submissionId);
                    fetchSubmissionDataFromCloud(submissionId, formId);
                };
                break;
            case 'Submitted':
                onPressCallback = () => {
                    navigation.navigate('View', { submissionId: submissionId, slug: formId, status: 'Submitted' });
                };
                break;
            case 'Synced':
                onPressCallback = () => {
                    navigation.navigate('View', { submissionId: submissionId, slug: formId, status: 'Synced' });
                };
                break;
                case 'Uploading':
                    onPressCallback = () => {
                        navigation.navigate('View', { submissionId: submissionId, slug: formId, status: 'Uploading' });
                    };
                    break;
            case 'Ready':
                onPressCallback = () => {
                    navigation.navigate('FormView');
                    tryUpdateCurrentForm({
                        form: formData,
                        formEndpoint: formEndpoint,
                    });
                    setCurrentFormData(formName, formId, formData.datagrid, formId);
                    updateFirebaseSubmissionId(submissionId);
                    fetchSubmissionDataFromCloud(submissionId, formId);
                };
                break;
            case 'Submitted':
                onPressCallback = () => { };
                break;
            default:
                isButtonActive = false;
        }

        return (
            <Button
                title="Continue"
                type="clear"
                onPress={onPressCallback}
                buttonStyle={{ backgroundColor: 'transparent' }}
            />

        );
    };
    const deleteFromFirebase = (formId, submissionId) => {
        firestore()
            .collection('submissions')
            .doc(formId)
            .collection('submissionData')
            .doc(submissionId)
            .delete()
            .then(() => {
                console.log(' firestore deleted!');
                setVisible(false);
                setCurrentSelectedSubmission(null);
                ToastAndroid.showWithGravityAndOffset(
                    'Submission has been deleted.You can pull to refresh to see changes',
                    ToastAndroid.LONG,
                    ToastAndroid.BOTTOM,
                    25,
                    50
                );
                console.log(' fheree!');
                firestore()
                    .collection('media')
                    .get()
                    .then(querySnapshot => {
                        querySnapshot.forEach(async documentSnapshot => {
                            var data = documentSnapshot.data();
                            console.log('1' + data.submissionId);
                            console.log('2' + submissionId);
                            if (data.submissionId == submissionId) {
                                console.log('3match' + submissionId);
                                firestore()
                                    .collection('media').doc(documentSnapshot.id).
                                    delete()
                                    .then(() => {
                                        console.log(' media deleted!');
                                    });
                            }

                        });
                    });
            });
    }
    const deleteSubmission = (formId, submissionId) => {
        deleteFromFirebase(formId, submissionId)
    }




    if (isLoading == true) {
        return (
            <ActivityIndicator size="large" color="purple" />
        );
    }
    return (
        <>
            <FlatList
                data={submissions}
                maxToRenderPerBatch={8}
                windowSize={8}
                initialNumToRender={5}
                keyExtractor={keyExtractor}
                renderItem={_renderItem}
                getItemLayout={getItemLayout}
                refreshControl={
                    <RefreshControl
                        refreshing={isFetching}
                        onRefresh={fetchData}
                    />
                }

            //s renderItem={({ item }) => <Todo {...item} />}
            />
            <Provider>
                <Portal>
                    <Modal visible={visible} onDismiss={hideModal}>

                        <CardPaper style={{ margin: 30, borderRadius: 15 }}>

                            <CardPaper.Title
                                title="Delete Form"
                                titleStyle={{ textAlign: 'center' }}
                                right={(props) => <IconButton {...props} icon="close" onPress={hideModal} />}
                            />
                            <Avatar.Icon size={80} icon="ab-testing" style={{ alignSelf: 'center', backgroundColor: 'gray' }} color="#fff" />
                            <CardPaper.Content>
                                <Title style={{ textAlign: 'center', fontSize: 14 }}>Submission Id:{currentSelectedSubmission}</Title>
                                <Paragraph style={{ color: '#0080ff', marginVertical: 5, fontWeight: 'bold', textAlign: 'center' }}>
                                    Disclaimer:After deleting data its associated media data will also will be deleted
</Paragraph>
                            </CardPaper.Content>
                            <CardPaper.Actions style={{ alignSelf: 'center' }}>
                                <ButtonPaper mode='contained' icon="delete" style={{ width: '90%', padding: 10, margin: 5, borderRadius: 10, backgroundColor: '#ff4500' }}

                                    onPress={() =>

                                        deleteSubmission(formId, currentSelectedSubmission)


                                    }

                                >Delete</ButtonPaper>

                            </CardPaper.Actions>
                        </CardPaper>

                    </Modal>

                </Portal>
            </Provider>

        </>
    );


};
export default connect(
    null,
    {
        setCurrentFormData: StoreActionsForm.setCurrentFormData,
        tryUpdateCurrentForm: StoreActionsForm.tryUpdateCurrentForm,
        initializeSubmission: StoreActionsSubmission.initializeSubmission,
        updateFirebaseSubmissionId:
            StoreActionsSubmission.updateFirebaseSubmissionId,
        fetchSubmissionDataFromCloud:
            StoreActionsSubmission.fetchSubmissionDataFromCloud,
        directSubmitDataFromCloudToFormio:
            StoreActionsSubmission.directSubmitDataFromCloudToFormio,
    },
)(Submissions);
const styles = StyleSheet.create({
    cardWrapper: {
        //paddingVertical: 10,
        // marginBottom: 15,
        //marginHorizontal: 10,
        borderRadius: 6
    },
    dateWrapper: {
        color: '#000',
        marginTop: 10
    },
    date: {
        marginRight: 20
    },
    formName: {
        fontWeight: '900',
        marginTop: 5,
        fontSize: 17,
        fontFamily: 'sans-serif-medium'
    },
    centerText: {
        textAlign: 'center'
    },
    statusWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start'
    },
    status: {
        marginTop: 20
    },
    centerText: {
        textAlign: 'center'
    },
    submission: {
        color: 'gray'
    },
    iconWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        alignSelf: 'flex-end'
    }
});