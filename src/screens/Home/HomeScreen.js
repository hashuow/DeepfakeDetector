import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { getFirestore, collection, query, where, orderBy, getDocs } from '@react-native-firebase/firestore';
import { getApp } from '@react-native-firebase/app';
import Sound from 'react-native-sound';
import moment from 'moment';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // 🔥 New import

Sound.setCategory('Playback');

const HomeScreen = () => {
  const [audioList, setAudioList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playingAudio, setPlayingAudio] = useState(null);

  useEffect(() => {
    fetchAudioFiles();
  }, []);

  const fetchAudioFiles = async () => {
    const userId = 'hash'; // Hardcoded userId

    try {
      console.log('Trying to fetch audio files for user:', userId);

      const db = getFirestore(getApp());
      const audioQuery = query(
        collection(db, 'audio_files'),
        where('userId', '==', userId),
        // orderBy('uploadedAt', 'desc')
      );

      const snapshot = await getDocs(audioQuery);

      console.log('Fetched docs:', snapshot.size);

      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setAudioList(list);
    } catch (error) {
      console.error('Error fetching audio files:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const playAudio = (audioUrl) => {
    if (playingAudio) {
      playingAudio.stop(() => {
        playingAudio.release();
      });
    }

    const sound = new Sound(audioUrl, null, (error) => {
      if (error) {
        console.error('Failed to load the sound', error);
        return;
      }
      sound.play((success) => {
        if (success) {
          console.log('Successfully finished playing');
        } else {
          console.error('Playback failed due to audio decoding errors');
        }
        sound.release();
        setPlayingAudio(null);
      });
    });

    setPlayingAudio(sound);
  };

  const getStatusIcon = (status) => {
    if (status === 'real') {
      return <Icon name="shield-check" size={24} color="green" />; // ✅ real
    } else if (status === 'fake') {
      return <Icon name="alert-circle" size={24} color="red" />; // ⚠️ fake
    } else {
      return <Icon name="help-circle" size={24} color="gray" />; // ❔ unknown
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading audio files...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Uploaded Audio Files</Text>

      {audioList.length === 0 ? (
        <Text>No audio files found for this user.</Text>
      ) : (
        <FlatList
  data={audioList}
  keyExtractor={(item) => item.id}
  refreshing={loading}         // ✅ Show spinner when refreshing
  onRefresh={fetchAudioFiles}  // ✅ Trigger fetching new data
  renderItem={({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.fileName}>{item.fileName}</Text>
        <View style={styles.statusRow}>
          {getStatusIcon(item.status)}
          <Text style={styles.statusText}> {item.status}</Text>
        </View>
        <Text style={styles.detail}>Location: {item.location || 'Unknown'}</Text>
        <Text style={styles.detail}>
          Uploaded: {item.uploadedAt?.seconds ? moment(item.uploadedAt.seconds * 1000).format('DD MMM YYYY, hh:mm A') : 'N/A'}
        </Text>
      </View>
      <TouchableOpacity style={styles.playButton} onPress={() => playAudio(item.fileUrl)}>
        <Text style={styles.playButtonText}>Play</Text>
      </TouchableOpacity>
    </View>
  )}
  ItemSeparatorComponent={() => <View style={styles.separator} />}
/>

      )}
    </View>
  );
};

export default HomeScreen;

// 🛠 Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#ffffff',
  },
  centered: {
    flex:1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    flexDirection: 'row',
    padding: 14,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
  },
  fileName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    marginLeft: 6,
    color: '#444',
  },
  detail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  playButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 10,
  },
  playButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  separator: {
    height: 14,
  },
});
