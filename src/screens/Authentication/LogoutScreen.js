import React, { useContext } from "react";
import { View, Text, Button, StyleSheet, Alert } from "react-native";
import { AuthContext } from "../../navigation/AppNavigator"; 
import AsyncStorage from '@react-native-async-storage/async-storage';

const LogoutScreen = () => {
  const { setIsLoggedIn } = useContext(AuthContext);

  const handleLogout = () => {
    Alert.alert(
      "Logout".toString(), // ✅ safe
      "Are you sure you want to logout?".toString(), // ✅ safe
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          onPress: async () => {
            console.log("Logging out...");
            await AsyncStorage.removeItem('isLoggedIn');
            setIsLoggedIn(false);
          },
        },
      ]
    );
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
