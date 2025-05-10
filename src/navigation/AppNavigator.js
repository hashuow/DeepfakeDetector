import React, { useState, useEffect, createContext, useContext } from "react";
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

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

// 🔥 Auth Context
const AuthContext = createContext();

// ✅ Drawer Navigator (only Home + Logout after login)
const DrawerNavigator = () => (
  <Drawer.Navigator
    initialRouteName="Home"
    screenOptions={{
      headerShown: true,
    }}
  >
    <Drawer.Screen name="Home" component={HomeScreen} />
    <Drawer.Screen name="Logout" component={LogoutScreen} />
  </Drawer.Navigator>
);

// ✅ Main Navigator
const AppNavigator = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Optional: Load from AsyncStorage to persist login
  useEffect(() => {
    const loadLoginStatus = async () => {
      const storedStatus = await AsyncStorage.getItem('isLoggedIn');
      if (storedStatus === 'true') {
        setIsLoggedIn(true);
      }
    };
    loadLoginStatus();
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn }}>
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
