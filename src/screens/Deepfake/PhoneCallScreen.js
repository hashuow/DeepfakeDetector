import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Sound from 'react-native-sound';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

Sound.setCategory('Playback');

const DETECTION_DELAY_MS = 5000; // 5 seconds configurable delay

const PhoneCallScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { audioPath } = route.params;

  const [isAudioLoading, setIsAudioLoading] = useState(true);
  const [callEnded, setCallEnded] = useState(false);
  const audioPlayerRef = useRef(null);

  useEffect(() => {
    if (!audioPath) {
      console.error('No audioPath provided!');
      return;
    }

    const fullPath = audioPath.startsWith('file://') ? audioPath : 'file://' + audioPath;
    console.log('Full audio path:', fullPath);

    const sound = new Sound(fullPath, Sound.DOCUMENT, (error) => {
      if (error) {
        console.error('Audio load error:', error);
        Alert.alert('Error', 'Failed to play selected audio.');
        return;
      }

      audioPlayerRef.current = sound;
      setIsAudioLoading(false);

      sound.play((success) => {
        if (!success) {
          console.error('Playback failed');
        }
        sound.release();
      });
    });

    const timer = setTimeout(() => {
      predictCall();
    }, DETECTION_DELAY_MS);

    return () => {
      clearTimeout(timer);
      if (audioPlayerRef.current) {
        audioPlayerRef.current.stop(() => {
          audioPlayerRef.current.release();
        });
      }
    };
  }, []);

  const predictCall = async () => {
    try {
      const formData = new FormData();
      formData.append('audio', {
        uri: 'file://' + audioPath,
        type: 'audio/wav',
        name: audioPath.split('/').pop(),
      });

      const response = await fetch('http://10.0.2.2:8000/predict/', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          Accept: 'application/json',
        },
        body: formData,
      });

      const data = await response.json();
      if (!data.real) {
        console.warn('Fake detected: stopping audio');

        if (audioPlayerRef.current) {
          audioPlayerRef.current.stop(() => {
            audioPlayerRef.current.release();
            audioPlayerRef.current = null;

            // ✅ Play alarm after stopping the incoming audio
            const alarm = new Sound('alarm', Sound.MAIN_BUNDLE, (error) => {
              if (error) {
                console.error('Alarm sound load error:', error);
                Alert.alert('Error', 'Alarm sound could not be played.');
                return;
              }
              alarm.play(() => {
                alarm.release();
              });
            });
          });
        }

        setCallEnded(true);

        setTimeout(() => {
          navigation.goBack();
        }, 3000);
      }
    } catch (err) {
      console.error('Prediction failed:', err);
      Alert.alert('Error', 'Failed to connect to prediction API.');
    }
  };

  const handleEndCall = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.stop(() => {
        audioPlayerRef.current.release();
        navigation.goBack();
      });
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.status}>
        {callEnded ? 'Call Ended' : isAudioLoading ? 'Dialing...' : 'Calling...'}
      </Text>

      <Image
        source={{
          uri: 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
        }}
        style={styles.avatar}
      />

      <Text style={styles.name}>+61 432 123 456</Text>
      <Text style={styles.subtext}>Mobile</Text>

      {isAudioLoading && (
        <ActivityIndicator size="large" color="white" style={{ marginBottom: 30 }} />
      )}

      <View style={styles.controls}>
        <View style={styles.controlButton}>
          <Icon name="volume-high" size={30} color="white" />
          <Text style={styles.controlLabel}>Speaker</Text>
        </View>

        <TouchableOpacity style={styles.endCallButton} onPress={handleEndCall}>
          <Icon name="phone-hangup" size={30} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PhoneCallScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#081C24',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  status: {
    fontSize: 18,
    color: '#aaa',
    marginBottom: 12,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  subtext: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 48,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButton: {
    alignItems: 'center',
    marginHorizontal: 30,
  },
  controlLabel: {
    color: 'white',
    marginTop: 6,
  },
  endCallButton: {
    backgroundColor: '#D32F2F',
    padding: 16,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
