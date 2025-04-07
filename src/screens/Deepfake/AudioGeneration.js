import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import Sound from 'react-native-sound';

const audioFiles = [
  { name: 'Voice 1', file: 'voice1' },
  { name: 'Fake Voice 1', file: 'df1' },
  { name: 'Fake Voice 2', file: 'df2' },
];

Sound.setCategory('Playback');

const AudioListScreen = () => {
  const [currentSound, setCurrentSound] = useState(null);
  const [currentFile, setCurrentFile] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [audioDurations, setAudioDurations] = useState({}); // { voice1: '00:12', df1: '00:09' }

  // Load durations once on mount
  useEffect(() => {
    const loadDurations = () => {
      const durations = {};
      audioFiles.forEach(({ file }) => {
        const sound = new Sound(file + '.mp3', Sound.MAIN_BUNDLE, (error) => {
          if (!error) {
            const duration = sound.getDuration();
            durations[file] = formatTime(duration);
            sound.release(); // release after use
          }
          if (Object.keys(durations).length === audioFiles.length) {
            setAudioDurations(durations);
          }
        });
      });
    };

    loadDurations();
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlay = (fileName) => {
    if (currentSound && currentFile === fileName) {
      if (isPaused) {
        currentSound.play(() => currentSound.release());
        setIsPaused(false);
      }
      return;
    }

    if (currentSound) {
      currentSound.stop(() => currentSound.release());
    }

    const sound = new Sound(fileName + '.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.log('❌ Failed to load sound:', error);
        return;
      }
      setCurrentSound(sound);
      setCurrentFile(fileName);
      setIsPaused(false);
      sound.play(() => {
        sound.release();
        setCurrentSound(null);
        setCurrentFile(null);
      });
    });
  };

  const handlePause = () => {
    if (currentSound && !isPaused) {
      currentSound.pause();
      setIsPaused(true);
    }
  };

  const handleStop = () => {
    if (currentSound) {
      currentSound.stop(() => {
        currentSound.release();
        setCurrentSound(null);
        setCurrentFile(null);
        setIsPaused(false);
      });
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <View style={styles.header}>
        <Text style={styles.text}>{item.name}</Text>
        <Text style={styles.duration}>{audioDurations[item.file] || '00:00'}</Text>
      </View>
      <View style={styles.controls}>
        <TouchableOpacity onPress={() => handlePlay(item.file)} style={styles.button}>
          <Text>▶️</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handlePause} style={styles.button}>
          <Text>⏸️</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleStop} style={styles.button}>
          <Text>⏹️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={audioFiles}
        keyExtractor={(item) => item.file}
        renderItem={renderItem}
      />
    </View>
  );
};

export default AudioListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  item: {
    padding: 15,
    backgroundColor: '#fff',
    marginBottom: 10,
    borderRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  text: {
    fontSize: 18,
    color: '#333',
  },
  duration: {
    fontSize: 16,
    color: '#666',
  },
  controls: {
    flexDirection: 'row',
    gap: 15,
  },
  button: {
    padding: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    marginRight: 10,
  },
});
