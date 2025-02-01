import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, PermissionsAndroid } from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import Sound from 'react-native-sound';
import axios from 'axios';

const Recorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedFilePath, setRecordedFilePath] = useState('');
  const audioRecorderPlayer = new AudioRecorderPlayer();

  // Request Permissions
  const requestPermissions = async () => {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      ]);
  
      const allGranted =
        granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED &&
        granted[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED &&
        granted[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED;
  
      if (!allGranted) {
        Alert.alert('Permissions Denied', 'Please grant all required permissions to proceed.');
      }
  
      return allGranted;
    } catch (error) {
      console.error('Permission request error:', error);
      Alert.alert('Error', 'Failed to request permissions.');
      return false;
    }
  };
  

  // Start Recording
  const startRecording = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      return;
    }
  
    try {
      setIsRecording(true);
      const result = await audioRecorderPlayer.startRecorder();
      setRecordedFilePath(result);
      console.log('Recording started:', result);
    } catch (error) {
      console.error('Error starting recorder:', error);
      Alert.alert('Error', 'Failed to start recording.');
    }
  };
  

  // Stop Recording
  const stopRecording = async () => {
    const result = await audioRecorderPlayer.stopRecorder();
    setIsRecording(false);
    setRecordedFilePath(result);
    console.log('Recording stopped:', result);
  };

  // Send File to API
  const sendToApi = async () => {
    if (!recordedFilePath) {
      Alert.alert('No Recording', 'Please record a voice first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', {
      uri: `file://${recordedFilePath}`,
      name: 'recordedVoice.wav',
      type: 'audio/wav',
    });

    try {
    //   const response = await axios.post('http://your-python-api-url.com/check-fake', formData, {
    //     headers: { 'Content-Type': 'multipart/form-data' },
    //   });

      if (true === true) {
        console.log('Fake detected! Triggering alarm...');
        triggerAlarm();
      } else {
        console.log('Voice is genuine.');
        Alert.alert('Result', 'The voice is genuine.');
      }
    } catch (error) {
      console.error('Error sending file to API:', error);
      Alert.alert('Error', 'Failed to send the file to the server.');
    }
  };

  // Trigger Alarm
  const triggerAlarm = () => {
    const alarmSound = new Sound('alarm.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.log('Failed to load the alarm sound:', error);
        return;
      }
      alarmSound.play(() => alarmSound.release());
    });
    Alert.alert('Fake Detected', 'An alarm has been triggered!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Voice Fake Detection</Text>

      {!isRecording ? (
        <TouchableOpacity style={styles.button} onPress={startRecording}>
          <Text style={styles.buttonText}>Start Recording</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={[styles.button, styles.stopButton]} onPress={stopRecording}>
          <Text style={styles.buttonText}>Stop Recording</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.button} onPress={sendToApi}>
        <Text style={styles.buttonText}>Analyze Voice</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    marginVertical: 10,
    width: '80%',
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: '#ff4d4d',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Recorder;
