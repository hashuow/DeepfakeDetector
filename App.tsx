import React, { useEffect } from "react";
import AppNavigator from "./src/navigation/AppNavigator";
// import { createTables } from "./src/database/schema";
import messaging from '@react-native-firebase/messaging';
import { Alert } from 'react-native';
import Sound from 'react-native-sound';

const App = () => {
  
  useEffect(() => {
    let unsubscribeFCM: (() => void) | null | undefined = undefined; // ✅ Correct typing
  
    const initializeApp = async () => {
     // await createTables();
      unsubscribeFCM = await setupFCM(); // could be undefined
    };
  
    initializeApp();
  
    return () => {
      if (unsubscribeFCM) {
        unsubscribeFCM(); // call unsubscribe safely
      }
    };
  }, []);
  

  const setupFCM = async () => {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  
      if (enabled) {
        console.log('Notification permission granted.');
  
        const token = await messaging().getToken();
        console.log('FCM Token:', token);
      } else {
        console.log(' Notification permission denied.');
      }

      // ✅ Prepare alarm sound
      Sound.setCategory('Playback'); // Important for Android/iOS
      const alarmSound = new Sound('alarm', Sound.MAIN_BUNDLE, (error) => {
        if (error) {
          console.error('Failed to load alarm sound', error);
        } else {
          console.log('Alarm sound loaded');
        }
      });
  
      const unsubscribe = messaging().onMessage(async remoteMessage => {
        console.log('New FCM Message:', remoteMessage);
      
        if (remoteMessage?.notification?.title === "Fake Voice Detected!") {
          if (alarmSound) {
            alarmSound.play((success) => {
              if (success) {
                console.log('Alarm sound played successfully');
              } else {
                console.error('Failed to play alarm sound');
              }
            });
          }
        }
      
        Alert.alert(
          remoteMessage.notification?.title || 'Alert',
          remoteMessage.notification?.body || 'You have a new message.'
        );
      });
      
  
      return unsubscribe;
    } catch (error) {
      const err = error as Error;
      console.error('Error setting up FCM:', err.message);
    }
  };
  

  return <AppNavigator />;
};

export default App;
