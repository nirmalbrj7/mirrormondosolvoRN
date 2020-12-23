import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { View, Text, FlatList, StyleSheet, Alert } from 'react-native';
import { Avatar, Card, Title, Paragraph, IconButton, Button } from 'react-native-paper';


export const CounterComponent = (props) => {
    const dispatch = useDispatch();
    return (
        <View>
            <Button icon="idcard" mode="contained" style={{ width: 250, alignSelf: 'center' }} onPress={(event) => dispatch({ type: 'clear_data', payload: 'wwww' })}>
                Clear Data
            </Button>
        </View>
    )
}
export default CounterComponent;
const styles = StyleSheet.create({
    
});

