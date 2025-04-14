import React, { use, useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { loginUser } from "../../database/queries"; // Import login function

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Please enter both email and password!");
      return;
    }

    try {
      const user = await loginUser(username, password);
      if(user != null) {
        console.log("Retunrd user object", user)
        navigation.navigate("Home", {user}); // Redirecting to Home after successful login
      }
      
    } catch (error) {
      console.log(error)
      Alert.alert("Login Failed", "Invalid credentials!");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Username"
        onChangeText={setUsername}
        value={username}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        onChangeText={setPassword}
        value={password}
      />

      {/* Buttons in a row */}
      <View style={styles.buttonContainer}>
        <View style={styles.button}>
          <Button title="Login" onPress={handleLogin} />
        </View>
        <View style={styles.button}>
          <Button title="Register" onPress={() => navigation.navigate("Register")} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  input: { width: "100%", borderWidth: 1, padding: 10, marginVertical: 5, borderRadius: 5 },
  buttonContainer: {
    flexDirection: "row", // Arrange buttons in a row
    justifyContent: "space-between", // Add space between buttons
    marginTop: 10,
  },
  button: {
    flex: 1, // Each button takes equal space
    marginHorizontal: 5, // Add space between buttons
  },
});

export default LoginScreen;
