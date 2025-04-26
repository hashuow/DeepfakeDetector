import React, { useEffect } from "react";
import AppNavigator from "./src/navigation/AppNavigator";
import { createTables } from "./src/database/schema";
import messaging from '@react-native-firebase/messaging';
import { Alert } from 'react-native';

const App = () => {
  useEffect(() => {
    const initializeApp = async () => {
      await createTables(); // ✅ Step 1: Setup database

      // ✅ Step 2: Setup FCM Notification
      await setupFCM();
    };

    initializeApp();
  }, []);

  const setupFCM = async () => {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  
      if (enabled) {
        console.log('🚀 Notification permission granted.');
  
        const token = await messaging().getToken();
        console.log('🔥 FCM Token:', token);
      } else {
        console.log('🚫 Notification permission denied.');
      }
  
      const unsubscribe = messaging().onMessage(async remoteMessage => {
        console.log('💬 New FCM Message:', remoteMessage);
        Alert.alert(remoteMessage.notification?.title || 'Alert', remoteMessage.notification?.body || 'You have a new message.');
      });
  
      return unsubscribe;
    } catch (error) {
      const err = error as Error; // ✅ Fix here
      console.error('Error setting up FCM:', err.message);
    }
  };
  

  return <AppNavigator />;
};

export default App;
