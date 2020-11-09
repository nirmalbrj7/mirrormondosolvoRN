import React, { Component } from 'react';
import { SafeAreaView, View, FlatList, StyleSheet, Text, Image,Button,Alert } from 'react-native';
import { Avatar, Card, Title, Paragraph, IconButton } from 'react-native-paper';
import { TouchableOpacity } from 'react-native-gesture-handler';



class Datagrid extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      cardObject:[]
    };
    this.addCard = this.addCard.bind(this);
  }
   addCard = ({ event}) => {
    const ID = this.state.cardObject.length + 1;
    const newObj = {
      id: ID,
      title: 'fouth item'
    };
    this.setState({
      cardObject:this.state.cardObject.concat(newObj)
    });  
  };
   removeCard = (event,id) => {
    Alert.alert(
      "Are you sure",
      "Delete data",

      [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel"
        },
        {
          text: "Yes",
          onPress: e => {
            const updatedCard = this.state.cardObject.filter(item => item.id !== id);
            this.setState({
              cardObject: updatedCard
            });
          }
        }
      ],
      { cancelable: false }
    );

  };
 

  render() {
    const cardObject=this.state.cardObject;
    return (
      <SafeAreaView style={styles.container}>
      <Text>cardObject{JSON.stringify(this.state.cardObject)}</Text>
      <Button title="Add" onPress={(event) => { this.addCard(event) }}/>
      <FlatList
        data={cardObject}
        renderItem={({ item }) =>(
          <View style={styles.item}>

          <Card>
            <Card.Title title="Card Title"
              right={(props) => (
                <View style={{ flexDirection: 'row', paddingRight: 10 }}>
                  <IconButton {...props} icon="close" onPress={(event) => { this.removeCard(event,item.id) }} />
                </View>
              )}
    
            />
            <Card.Content>
              <Title>{item.title}</Title>
              <Paragraph>{item.id}</Paragraph>
            </Card.Content>
    
          </Card>
        </View>
        )}
        keyExtractor={item => item.id}
      />
    </SafeAreaView>
    );
  }
}

export default Datagrid;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 5,
  },
  item: {
    backgroundColor: '#f9c2ff',
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 32,
  },
});
