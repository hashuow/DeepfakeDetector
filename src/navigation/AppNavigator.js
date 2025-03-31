import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { NavigationContainer } from "@react-navigation/native";
import RegisterScreen from "../screens/Authentication/RegisterScreen";
import AudioGeneration from "../screens/Deepfake/AudioGeneration";
import HomeScreen from "../screens/Home/HomeScreen";
import LoginScreen from "../screens/Authentication/LoginScreen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import LogoutScreen from "../screens/Authentication/Logoutscreen";
import DashboardScreen from "../screens/Home/Dashboard";
const Drawer = createDrawerNavigator();

const AppNavigator = () => {
  return (
    // <NavigationContainer>
    //   <Stack.Navigator initialRouteName="Login">
    //     <Stack.Screen name="Register" component={RegisterScreen} />
    //     <Stack.Screen name="Home" component={HomeScreen} />
    //     <Stack.Screen name="AudioGeneration" component={AudioGeneration} />
    //     <Stack.Screen name="Login" component={LoginScreen}/>
    //   </Stack.Navigator>
    // </NavigationContainer>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Drawer.Navigator initialRouteName="Login">
          <Drawer.Screen name="Register" component={RegisterScreen} />
          <Drawer.Screen name="Login" component={LoginScreen}/>
          <Drawer.Screen name="Home" component={HomeScreen} />
          <Drawer.Screen name="AudioGeneration" component={AudioGeneration} />
          <Drawer.Screen name="Logout" component={LogoutScreen} />
          <Drawer.Screen name="Dashboard" component={DashboardScreen} />
        </Drawer.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
};

export default AppNavigator;
