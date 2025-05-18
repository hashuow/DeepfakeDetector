import React, { useState, useEffect, createContext } from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Screens
import RegisterScreen from "../screens/Authentication/RegisterScreen";
import LoginScreen from "../screens/Authentication/LoginScreen";
import HomeScreen from "../screens/Home/HomeScreen";
import LogoutScreen from "../screens/Authentication/LogoutScreen";
import PhoneCallScreen from "../screens/Deepfake/PhoneCallScreen";
import CallInsightsScreen from "../screens/Home/CallInsightsScreen";
import ProfileScreen from "../screens/Home/ProfileScreen";

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

// Auth Context
const AuthContext = createContext();

// Drawer Navigator (Home + Logout)
const DrawerNavigator = () => (
  <Drawer.Navigator
    initialRouteName="Call Insight"
    screenOptions={{ headerShown: true }}
  >
    <Drawer.Screen name="Call Insight" component={CallInsightsScreen} />
    <Drawer.Screen name="Call History" component={HomeScreen} />
    <Drawer.Screen name="Profile Settings" component={ProfileScreen} />
    <Drawer.Screen name="Logout" component={LogoutScreen} />
  </Drawer.Navigator>
);

// Main Navigator
const AppNavigator = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");

  // Restore login state & username from AsyncStorage
  useEffect(() => {
    const loadLoginStatus = async () => {
      const storedStatus = await AsyncStorage.getItem('isLoggedIn');
      const storedUsername = await AsyncStorage.getItem('username');
      if (storedStatus === 'true') {
        setIsLoggedIn(true);
        setUsername(storedUsername || "");
      }
    };
    loadLoginStatus();
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, username, setUsername }}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationContainer>
          {isLoggedIn ? (
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="DrawerRoot" component={DrawerNavigator} />
              <Stack.Screen name="PhoneCallScreen" component={PhoneCallScreen} />
            </Stack.Navigator>
          ) : (
            <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
            </Stack.Navigator>
          )}
        </NavigationContainer>
      </GestureHandlerRootView>
    </AuthContext.Provider>
  );
};

export { AuthContext };
export default AppNavigator;
