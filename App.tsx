import React,{ useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import LoginScreen from './components/Login'; // Ensure the correct path
import RegisterScreen from './components/Register'; // Ensure the correct path
import Dashboard from './components/Dashboard'; 
import { getDatabase } from './service/database';


// Define the types for navigation and route parameters
export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  Register: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const App = () => {
  useEffect(() => {
    // Initialize the database and create tables when the app starts
    // initializeDatabase();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Dashboard" component={Dashboard} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};


export default App;
