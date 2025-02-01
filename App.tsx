import React,{ useEffect } from 'react';
import { View, Text, Button, Alert, PermissionsAndroid } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import LoginScreen from './components/Login'; // Ensure the correct path
import RegisterScreen from './components/Register'; // Ensure the correct path
import Dashboard from './components/Dashboard'; 
import Recorder from './components/Recorder'; 
import { getDatabase } from './service/database';


// Define the types for navigation and route parameters
export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  Register: undefined;
  Recorder: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const App = () => {
  
  const requestPermissions = async () => {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      ]);

      const allGranted = Object.values(granted).every(
        (status) => status === PermissionsAndroid.RESULTS.GRANTED
      );

      if (allGranted) {
        Alert.alert('Permissions Granted', 'You can use microphone and storage');
      } else {
        Alert.alert('Permissions Denied', 'Some permissions were not granted');
      }
    } catch (error) {
      console.error('Permission error:', error);
    }
  };

  useEffect(() => {
    // Initialize the database and create tables when the app starts
    // initializeDatabase();
    requestPermissions();

  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Dashboard" component={Dashboard} />
        <Stack.Screen name="Recorder" component={Recorder} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};


export default App;
