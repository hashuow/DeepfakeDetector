import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Text, Button } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import Sound from 'react-native-sound';
import RNFS from 'react-native-fs';
import { insertAudioFile, getAllAudioFiles } from '../../database/queries';

Sound.setCategory('Playback');

const RecorderScreen = () => {
  const [recordSecs, setRecordSecs] = useState(0);
  const [recordTime, setRecordTime] = useState('00:00:00');
  const [playTime, setPlayTime] = useState('00:00:00');
  const [duration, setDuration] = useState('00:00:00');
  const [audioPath, setAudioPath] = useState(null);
  const [audioList, setAudioList] = useState([]);
  const [selectedAudio, setSelectedAudio] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [soundInstance, setSoundInstance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('Record'); // Record or Select

  const audioRecorderPlayer = useRef(new AudioRecorderPlayer()).current;

  useEffect(() => {
    (async () => {
      const files = await getAllAudioFiles();
      setAudioList(files);
      if (files.length > 0) setSelectedAudio(files[0].filepath);
    })();
  }, []);

  const getRecordingPath = () => {
    const filename = `audio_${Date.now()}`;
    const extension = Platform.OS === 'android' ? '.wav' : '.m4a';
    return `${RNFS.DocumentDirectoryPath}/${filename}${extension}`;
  };

  const onStartRecord = async () => {
    const path = getRecordingPath();
    const uri = await audioRecorderPlayer.startRecorder(path);
    setAudioPath(path);
    setIsRecording(true);
    setIsPaused(false);

    audioRecorderPlayer.addRecordBackListener((e) => {
      setRecordSecs(e.currentPosition);
      setRecordTime(audioRecorderPlayer.mmssss(Math.floor(e.currentPosition)));
    });

    console.log('Recording started at:', uri);
  };

  const onPauseOrResumeRecord = async () => {
    if (!isRecording) return;

    if (!isPaused) {
      await audioRecorderPlayer.pauseRecorder();
      setIsPaused(true);
    } else {
      await audioRecorderPlayer.resumeRecorder();
      setIsPaused(false);
    }
  };

  const onStopRecord = async () => {
    const result = await audioRecorderPlayer.stopRecorder();
    audioRecorderPlayer.removeRecordBackListener();
    setIsRecording(false);
    setIsPaused(false);
    setRecordSecs(0);
    setRecordTime('00:00:00');

    const filename = result?.split('/').pop();
    if (result && filename) {
      await insertAudioFile(filename, result);
      const updated = await getAllAudioFiles();
      setAudioList(updated);
      setSelectedAudio(result);
      Alert.alert('Success', `Audio saved to database.`);
    }
  };

  const playAudio = (path) => {
    const sound = new Sound(path, '', (error) => {
      if (error) {
        Alert.alert('Error', 'Cannot play this audio.');
        return;
      }
      setSoundInstance(sound);
      setIsPlaying(true);
      sound.play(() => {
        setIsPlaying(false);
        sound.release();
      });
    });
  };

  const pauseAudio = () => soundInstance?.pause();
  const resumeAudio = () => soundInstance?.play();
  const stopAudio = () => {
    soundInstance?.stop(() => {
      setIsPlaying(false);
      soundInstance.release();
    });
  };

  const submitAudio = async () => {
    if (!selectedAudio) return Alert.alert('Error', 'No audio selected');

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('audio', {
        uri: 'file://' + selectedAudio,
        type: 'audio/mpeg',
        name: selectedAudio.split('/').pop(),
      });

      const response = await fetch('http://10.0.2.2:8000/predict/', {
        method: 'POST',
        headers: { 'Content-Type': 'multipart/form-data' },
        body: formData,
      });

      const data = await response.json();
      Alert.alert('Result', data.real ? '✅ Real call detected.' : '🚨 Fake call detected.');
    } catch (err) {
      Alert.alert('Error', 'Failed to submit audio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recorder</Text>

      {/* <View style={styles.modeSwitch}>
        <Button mode={mode === 'Record' ? 'contained' : 'outlined'} onPress={() => setMode('Record')}>
          Record
        </Button>
        <Button mode={mode === 'Select' ? 'contained' : 'outlined'} onPress={() => setMode('Select')}>
          Select
        </Button>
      </View> */}

      {mode === 'Record' ? (
        <>
          <View style={styles.micContainer}>
            <View style={styles.outerCircle}>
              <View style={styles.innerCircle}>
                <Icon name="microphone" size={64} color="#fff" />
              </View>
            </View>
          </View>

          <Text style={styles.timer}>{recordTime}</Text>

          {isRecording && (
            <TouchableOpacity style={styles.pauseButton} onPress={onPauseOrResumeRecord}>
              <Icon name={isPaused ? 'play' : 'pause'} size={28} color="#EF5350" />
            </TouchableOpacity>
          )}

          <Button
            mode="contained"
            onPress={isRecording ? onStopRecord : onStartRecord}
            style={[styles.controlButton, { backgroundColor: isRecording ? '#EF5350' : '#4CAF50' }]}
            labelStyle={{ color: 'white' }}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </Button>
        </>
      ) : (
        <>
          <Picker
            selectedValue={selectedAudio}
            onValueChange={(value) => setSelectedAudio(value)}
            style={styles.picker}
          >
            {audioList.map((file) => (
              <Picker.Item key={file.id} label={file.filename} value={file.filepath} />
            ))}
          </Picker>

          <View style={styles.playControls}>
            <Button onPress={() => playAudio(selectedAudio)}>Play</Button>
            <Button onPress={pauseAudio}>Pause</Button>
            <Button onPress={resumeAudio}>Resume</Button>
            <Button onPress={stopAudio}>Stop</Button>
          </View>
        </>
      )}

      {/* <Button
        mode="contained"
        onPress={submitAudio}
        disabled={!selectedAudio || loading}
        style={[styles.controlButton, { marginTop: 20 }]}
      >
        Submit to API
      </Button> */}

      {loading && <ActivityIndicator style={{ marginTop: 10 }} />}
    </View>
  );
};

export default RecorderScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  title: {
    fontSize: 20,
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  micContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  outerCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#C8F2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EF5350',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timer: {
    fontSize: 18,
    marginVertical: 12,
    textAlign: 'center',
  },
  pauseButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#C8F2E2',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  controlButton: {
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 6,
    alignSelf: 'center',
  },
  modeSwitch: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 12,
  },
  picker: {
    marginVertical: 20,
  },
  playControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
});
