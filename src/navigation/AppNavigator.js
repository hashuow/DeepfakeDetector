import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import RegisterScreen from "../screens/Authentication/RegisterScreen";
import LoginScreen from "../screens/Authentication/LoginScreen";
import HomeScreen from "../screens/Home/HomeScreen";
import AudioGeneration from "../screens/Deepfake/AudioGeneration";
import AudioCheckerScreen from "../screens/Deepfake/AudioCheckerScreen";
import RecorderScreen from "../screens/Deepfake/RecorderScreen";
import IncomingCallSimulator from "../screens/Deepfake/IncomingCallSimulator";
import PhoneCallScreen from "../screens/Deepfake/PhoneCallScreen"; // ✅

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

// ✅ Drawer Navigator
const DrawerNavigator = () => (
  <Drawer.Navigator initialRouteName="Login">
    <Drawer.Screen name="Register" component={RegisterScreen} />
    <Drawer.Screen name="Login" component={LoginScreen} />
    <Drawer.Screen name="Home" component={HomeScreen} />
    <Drawer.Screen name="AudioGeneration" component={AudioGeneration} />
    <Drawer.Screen name="AudioCheckerScreen" component={AudioCheckerScreen} />
    <Drawer.Screen name="RecorderScreen" component={RecorderScreen} />
    <Drawer.Screen name="IncomingCallSimulator" component={IncomingCallSimulator} />
  </Drawer.Navigator>
);

// ✅ Stack Navigator correctly wrapping Drawer
const AppNavigator = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="DrawerRoot" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="DrawerRoot" component={DrawerNavigator} />
          <Stack.Screen name="PhoneCallScreen" component={PhoneCallScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
};

export default AppNavigator;
