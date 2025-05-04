import React, { useState, useEffect } from 'react';
import { NativeModules, Button, View, TextInput, StyleSheet, Alert } from 'react-native';
import { DeviceEventEmitter } from 'react-native';


const { LinphoneService } = NativeModules;

export default function App() {
  const [username, setUsername] = useState<string>('hashmiyauow');
  const [password, setPassword] = useState<string>('l3A_0048');
  const [domain, setDomain] = useState<string>('sip.linphone.org');

  useEffect(() => {
    console.log('App started, attempting auto-login...');

    if (LinphoneService?.register) {
      try {
        LinphoneService.register(username, password, domain);
        console.log('Auto-login: Register call triggered');
        Alert.alert('Login', 'SIP login requested');
      } catch (error) {
        console.error('Auto-login failed:', error);
        Alert.alert('Error', 'SIP login failed!');
      }
    } else {
      console.error('LinphoneService.register not available');
    }

    // Listen for SIP registration status
  const regListener = DeviceEventEmitter.addListener('RegistrationStateChanged', (message) => {
    console.log('📶 SIP Registration:', message);
    Alert.alert('SIP Status', message);
  });

  // Listen for incoming call
  const callListener = DeviceEventEmitter.addListener('IncomingCall', () => {
    console.log('📞 Incoming call detected!');
    Alert.alert('Call', 'Incoming call received!');
  });

  // Clean up listeners on unmount
  return () => {
    regListener.remove();
    callListener.remove();
  };
  }, []); // <-- run once when app starts

  const handleAcceptCall = () => {
    LinphoneService?.acceptCall?.();
  };

  const handleDeclineCall = () => {
    LinphoneService?.declineCall?.();
  };

  
  return (
    <View style={styles.container}>
      <Button title="Accept Call" onPress={handleAcceptCall} />
      <View style={styles.spacer} />
      <Button title="Decline Call" onPress={handleDeclineCall} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  spacer: {
    height: 12,
  },
});
