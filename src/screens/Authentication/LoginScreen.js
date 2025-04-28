import React, { useState, useContext } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert, ImageBackground, Image, ActivityIndicator } from "react-native";
import { loginUser } from "../../database/firestoreDB"; 
import bcrypt from 'react-native-bcrypt';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from "../../navigation/AppNavigator"; // Import AuthContext
import backgroundImage from "../../../assets/background.png"; // Background image
import logoImage from "../../../assets/logo.jpg"; // Logo image

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { setIsLoggedIn } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Please enter both username and password!");
      return;
    }

    setLoading(true); // Start loading when login clicked

    try {
      const user = await loginUser(username);
      if (user && bcrypt.compareSync(password, user.password)) {
        console.log("Returned user object", user);

        setIsLoggedIn(true);
        await AsyncStorage.setItem('isLoggedIn', 'true');
      } else {
        Alert.alert("Login Failed", "Invalid credentials!");
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Login Failed", "Invalid credentials!");
    } finally {
      setLoading(false); // Stop loading after login attempt
    }
  };

  return (
    <ImageBackground source={backgroundImage} style={styles.background}>
      <View style={styles.container}>
        <Image source={logoImage} style={styles.logo} />
        <Text style={styles.title}>Login</Text>

        <TextInput
          style={styles.input}
          placeholder="Username"
          onChangeText={setUsername}
          value={username}
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          onChangeText={setPassword}
          value={password}
          editable={!loading}
        />

        <View style={styles.buttonContainer}>
          <View style={styles.button}>
            <Button title="Login" onPress={handleLogin} disabled={loading} />
          </View>
          <View style={styles.button}>
            <Button title="Register" onPress={() => navigation.navigate("Register")} disabled={loading} />
          </View>
        </View>

        {/* Show Activity Indicator and Loading Text when loading */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text style={styles.loadingText}>Logging in, please wait...</Text>
          </View>
        )}
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
    position: "relative",
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
  loadingOverlay: {
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#000",
  },
});

export default LoginScreen;
