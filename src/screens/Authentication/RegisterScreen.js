import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import User from "../../model/User"; // Import User model
import { insertUser } from "../../database/firestoreDB"; // Import DB query function

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

    const newUser = new User(
      userDetails.firstName,
      userDetails.lastName,
      userDetails.username,
      userDetails.email,
      userDetails.password,
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

      // ✅ Corrected navigation
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
    <View style={styles.container}>
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
  );
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  input: { borderWidth: 1, padding: 10, marginVertical: 5, borderRadius: 5 },
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
