import React, { use, useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert, ImageBackground, Image } from "react-native";
import { loginUser } from "../../database/queries"; // Import login function
import bcrypt from 'react-native-bcrypt';
import backgroundImage from "../../assets/background.png";
import logoImage from "../../assets/logo.jpg";

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Please enter both email and password!");
      return;
    }

    try {
      const user = await loginUser(username);
      console.log(password);
      console.log(user.password);
      if(user && bcrypt.compareSync(password, user.password)) {
        console.log("Returned user object", user)
        navigation.navigate("Home", {user}); // Redirecting to Home after successful login
      }
    } catch (error) {
      console.log(error)
      Alert.alert("Login Failed", "Invalid credentials!");
    }
  };


  return (
    <ImageBackground source={backgroundImage} style={styles.background}>
      <View style={styles.container}>
        <Image source={logoImage} style={styles.logo} />
        <Text style={styles.title}>Login</Text>

        <TextInput style={styles.input} placeholder="Username" onChangeText={setUsername} value={username} />
        <TextInput style={styles.input} placeholder="Password" secureTextEntry onChangeText={setPassword} value={password} />

        <View style={styles.buttonContainer}>
          <View style={styles.button}>
            <Button title="Login" onPress={handleLogin} />
          </View>
          <View style={styles.button}>
            <Button title="Register" onPress={() => navigation.navigate("Register")} />
          </View>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center",
  },
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    margin: 20,
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  logo: {
    width: 120,
    height: 120,
    alignSelf: "center",
    marginBottom: 20,
    borderRadius: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
    backgroundColor: "#fff",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
});

export default LoginScreen;
