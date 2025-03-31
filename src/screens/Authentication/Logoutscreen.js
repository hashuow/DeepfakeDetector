import React from "react";
import { View, Text, Button, StyleSheet, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";

const LogoutScreen = () => {
  const navigation = useNavigation();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: () => {
          console.log("Logging out...");
          navigation.navigate("Login"); // Use navigate instead of replace
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>You are logged in!</Text>
      <Button title="Logout" onPress={handleLogout} color="#FF3B30" />
    </View>
  );
};

export default LogoutScreen;

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
});
