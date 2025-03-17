import React from "react";
import { View, Text, StyleSheet } from "react-native";

const HomeScreen = ({ route }) => {

  const { user } = route.params;
  console.log("from home screen ", user)
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Home Screen, {user.lastName}!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
});

export default HomeScreen;
