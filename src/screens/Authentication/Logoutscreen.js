import React from "react";
import { View, Text, Button, StyleSheet, Alert } from "react-native";

const LogoutScreen = ({ navigation }) => {
  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", onPress: () => navigation.navigate("Login") },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>You are logged in!</Text>

      <View style={styles.buttonContainer}>
        <Button title="Logout" onPress={handleLogout} color="#FF3B30" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  buttonContainer: {
    marginTop: 10,
    width: "100%",
  },
});

export default LogoutScreen;
