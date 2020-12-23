import React,{useEffect,useState,useCallback} from 'react';
import { Avatar, Card } from 'react-native-paper';
import { View, Text,ActivityIndicator,FlatList } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useSelector, useDispatch } from 'react-redux'
const FormList=(props)=>{
    const [isLoading, setLoading] = useState(true);
    const [form, setForm] = useState(null);
    const currentUid = auth().currentUser.uid;
        const orgSlug = useSelector(state => {
      //console.log("STATE" + JSON.stringify(state.datagridreducer))
      return state.userreducer.organization;
    });
    const formRef = firestore().collection(`forms_${orgSlug}`).where('userIds', 'array-contains', currentUid);
    const LeftContent = props => <Avatar.Icon {...props} icon="form" />
    useEffect(() => {
        const unsubscribe =  formRef.onSnapshot(querySnapshot => {
            const list = [];

            querySnapshot.forEach(doc => {
               const { name, slug } = doc.data();
               list.push({
                id: doc.id,
                name,
                slug,
              });

            });
            setForm(list);

            if (isLoading) {
              setLoading(false);
            }
        });
        return () => unsubscribe();

    }, []);
    const _renderItem=({item})=>{
return(
    <Card onPress={() => { 
        props.navigation.navigate('SubmissionsSingle',{id:item.slug})     
        //  onPress(form); 
        }} style={{
        
      
        paddingVertical: 5,
        marginBottom: 15,
        marginHorizontal: 10,
        borderRadius: 10
      }}>
        <Card.Title title={item.name} left={LeftContent} titleStyle={{fontSize: 17, fontFamily: 'sans-serif-light',fontWeight:'bold' }} />
      </Card>
);
    }
    const keyExtractor = useCallback((item) => item.slug, []);
    const ITEM_HEIGHT = 200;
    const getItemLayout = useCallback((data, index) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index,
    }), []);
    if(isLoading==true)
    
        return(
            <ActivityIndicator size="large" color="purple"/>
        );
    
    return (
        <View style={{ backgroundColor: '#F4F4F4' }}>
      

      <FlatList
                data={form}
                maxToRenderPerBatch={8}
                windowSize={8}
                initialNumToRender={5}
                keyExtractor={keyExtractor}
                renderItem={_renderItem}
                //getItemLayout={getItemLayout}
               /* refreshControl={
                    <RefreshControl
                        refreshing={isFetching}
                        onRefresh={fetchData}
                    />
                }*/

            //s renderItem={({ item }) => <Todo {...item} />}
            />



        </View>
    
      );

}
export  default FormList;