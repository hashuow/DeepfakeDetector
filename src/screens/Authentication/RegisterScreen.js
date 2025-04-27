import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert, ImageBackground, Image } from "react-native";
import User from "../../model/User"; // Import User model
import { insertUser } from "../../database/queries"; // Import DB query function
import bcrypt from 'react-native-bcrypt';
import backgroundImage from "../../assets/background.png";
import logoImage from "../../assets/logo.jpg";



const RegisterScreen = ({ navigation }) => {
  const [userDetails, setUserDetails] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    phone: "",
  });

  const handleInputChange = (field, value) => {
    setUserDetails({ ...userDetails, [field]: value });
  };

  const handleRegister = async () => {
    if (
      !userDetails.firstName ||
      !userDetails.lastName ||
      !userDetails.username ||
      !userDetails.email ||
      !userDetails.password ||
      !userDetails.phone
    ) {
      Alert.alert("Error", "All fields are required!");
      return;
    }

    // Validating User email address
    if (!userDetails.email.includes("@")) {
      Alert.alert("Error", "Please enter a valid email address!");
      return;
    }

    // Hashing password via bcrypt.js
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(userDetails.password, salt);

    const newUser = new User(
      userDetails.firstName,
      userDetails.lastName,
      userDetails.username,
      userDetails.email,
      hashedPassword,
      parseInt(userDetails.phone, 10)
    );


    try {
      await insertUser(newUser);
      Alert.alert("Success", "User registered successfully!");
      setUserDetails({
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        password: "",
        phone: "",
      });

      // Corrected navigation
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate("Login");
      }
    } catch (error) {
      Alert.alert("Error", "User registration failed. Email or phone may already exist.");
      console.error("Error inserting user:", error);
    }
  };

  return (
    <ImageBackground source={backgroundImage} style={styles.background}>
      <View style={styles.container}>
        <Image source={logoImage} style={styles.logo} />
        <Text style={styles.title}>Register</Text>

        <TextInput
          style={styles.input}
          placeholder="First Name"
          onChangeText={(text) => handleInputChange("firstName", text)}
          value={userDetails.firstName}
        />
        <TextInput
          style={styles.input}
          placeholder="Last Name"
          onChangeText={(text) => handleInputChange("lastName", text)}
          value={userDetails.lastName}
        />
        <TextInput
          style={styles.input}
          placeholder="Username"
          onChangeText={(text) => handleInputChange("username", text)}
          value={userDetails.username}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          keyboardType="email-address"
          onChangeText={(text) => handleInputChange("email", text)}
          value={userDetails.email}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          onChangeText={(text) => handleInputChange("password", text)}
          value={userDetails.password}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          keyboardType="numeric"
          onChangeText={(text) => handleInputChange("phone", text)}
          value={userDetails.phone}
        />

        {/* Buttons in a row */}
        <View style={styles.buttonContainer}>
          <View style={styles.button}>
            <Button title="Register" onPress={handleRegister} />
          </View>
          <View style={styles.button}>
            <Button title="Go to Login" onPress={() => navigation.navigate("Login")} />
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

export default RegisterScreen;
