import React, { useState, useEffect, useContext,useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import Video from 'react-native-video';
import Sound from 'react-native-sound';
import RNFS from 'react-native-fs';
import axios from 'axios';
import { insertAudioFile } from '../../database/firestoreDB';
import { AuthContext } from '../../navigation/AppNavigator';

const { width, height } = Dimensions.get('window');

const StreamPlayer = ({ recordingUrl, from, to, onEnd }) => {
  const [callAccepted, setCallAccepted] = useState(false);
  const [paused, setPaused] = useState(true);
  const [isFakeCall, setIsFakeCall] = useState(null);
  const ringtoneRef = useRef(null);
  const alarmRef = useRef(null);
  const alarmTimeoutRef = useRef(null);
  // const { username } = useContext(AuthContext);

  useEffect(() => {
    Sound.setCategory('Playback');

    ringtoneRef.current = new Sound('ringtone', Sound.MAIN_BUNDLE, (error) => {
      if (!error) {
        ringtoneRef.current.setNumberOfLoops(-1);
        ringtoneRef.current.play();
      } else {
        console.error('Failed to load ringtone:', error);
      }
    });

    return () => {
      stopRingtone();
      if (alarmTimeoutRef.current) {
        clearTimeout(alarmTimeoutRef.current);
      }
    };
  }, []);

  const stopRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.stop();
      ringtoneRef.current.release();
      ringtoneRef.current = null;
    }
  };

  const playAlarm = () => {
    alarmRef.current = new Sound('alarm', Sound.MAIN_BUNDLE, (error) => {
      if (!error) {
        alarmRef.current.play((success) => {
          if (!success) {
            console.error('Alarm playback failed');
          }
          alarmRef.current.release();
        });
      } else {
        console.error(' Failed to load alarm sound:', error);
      }
    });
  };

  const handleAccept = async () => {
    stopRingtone();
    setCallAccepted(true);
    setPaused(false);

    try {
      const localPath = `${RNFS.DocumentDirectoryPath}/call_${Date.now()}.mp3`;
      const downloadResult = await RNFS.downloadFile({
        fromUrl: recordingUrl,
        toFile: localPath,
      }).promise;

      if (downloadResult.statusCode !== 200) {
        console.error('Failed to download audio');
        return;
      }

      console.log('Audio downloaded to:', localPath);

      const formData = new FormData();
      formData.append('audio', {
        uri: 'file://' + localPath,
        type: 'audio/mpeg',
        name: 'call_audio.mp3',
      });

      let isFake = true;

     
      const response = await axios.post('http://10.0.2.2:8000/predict/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Accept: 'application/json',
        },
      });
      

      const predictionResult = response.data;
      isFake = predictionResult.real;

      console.log(' Prediction response:', predictionResult);
      setIsFakeCall(isFake);

      await insertAudioFile(
        {
          from,
          to,
          recordingUrl,
          timestamp: new Date(),
          prediction: predictionResult,
        },
        to
      );

      // Trigger alarm + alert + auto hangup after 5s
      if (isFake) {
        alarmTimeoutRef.current = setTimeout(() => {
          playAlarm();
          Alert.alert('Fake Call Detected', 'This appears to be a spoofed voice.');
          handleReject(); // auto hangup
        }, 5000);
      }

    } catch (error) {
      console.error('Error in handleAccept:', error.message);
    }
  };

  const handleReject = () => {
    stopRingtone();
    setPaused(true);
    setCallAccepted(false);

    if (alarmTimeoutRef.current) {
      clearTimeout(alarmTimeoutRef.current);
      alarmTimeoutRef.current = null;
    }

    onEnd();
  };

  return (
    <View style={styles.fullscreen}>
      <StatusBar hidden={true} />

      {!callAccepted ? (
        <>
          <Text style={styles.incomingText}>📞 Incoming Call</Text>
          <Text style={styles.fromText}>{from || 'Unknown Caller'}</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.rejectButton} onPress={handleReject}>
              <Text style={styles.buttonText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
              <Text style={styles.buttonText}>Accept</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.inCallText}>🔊 In Call</Text>
          <TouchableOpacity style={styles.hangupButton} onPress={handleReject}>
            <Text style={styles.buttonText}>Hang Up</Text>
          </TouchableOpacity>
        </>
      )}

      {callAccepted && (
        <Video
          source={{ uri: recordingUrl }}
          paused={paused}
          audioOnly
          onError={(e) => console.error('Audio error:', e)}
          onEnd={() => {
            setPaused(true);
            if (alarmTimeoutRef.current) {
              clearTimeout(alarmTimeoutRef.current);
              alarmTimeoutRef.current = null;
            }
            onEnd();
          }}
          style={{ height: 0, width: 0 }}
        />
      )}
    </View>
  );
};

export default StreamPlayer;

const styles = StyleSheet.create({
  fullscreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: height,
    width: width,
    backgroundColor: '#0b1623',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  incomingText: {
    fontSize: 24,
    color: '#ccc',
    marginBottom: 10,
  },
  fromText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 30,
  },
  inCallText: {
    fontSize: 28,
    color: 'white',
    marginBottom: 40,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: width * 0.9,
  },
  acceptButton: {
    backgroundColor: '#28a745',
    paddingVertical: 18,
    paddingHorizontal: 28,
    borderRadius: 60,
    marginHorizontal: 10,
  },
  rejectButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 18,
    paddingHorizontal: 28,
    borderRadius: 60,
    marginHorizontal: 10,
  },
  hangupButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 60,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 18,
  },
});
