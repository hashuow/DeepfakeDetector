import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { getFirestore, collection, query, where, getDocs } from '@react-native-firebase/firestore';
import { getApp } from '@react-native-firebase/app';
import moment from 'moment';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Video from 'react-native-video';

const HomeScreen = () => {
  const [audioList, setAudioList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState(null);
  const [paused, setPaused] = useState(true);

  useEffect(() => {
    fetchAudioFiles();
  }, []);

  const fetchAudioFiles = async (isRefresh = false) => {
    const userId = 'hash'; // 🔥 Your user ID

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      console.log('Fetching audio files for user:', userId);

      const db = getFirestore(getApp());
      const audioQuery = query(
        collection(db, 'audio_files'),
        where('userId', '==', userId),
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
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handlePlayPause = (audioUrl) => {
    if (currentAudioUrl === audioUrl) {
      setPaused(!paused); // toggle pause/play
    } else {
      setCurrentAudioUrl(audioUrl);
      setPaused(false); // play new audio
    }
  };

  const getStatusIcon = (status) => {
    if (status === 'real') {
      return <Icon name="shield-check" size={24} color="green" />;
    } else if (status === 'fake') {
      return <Icon name="alert-circle" size={24} color="red" />;
    } else {
      return <Icon name="help-circle" size={24} color="gray" />;
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchAudioFiles(true)}
              colors={['#4CAF50']}
            />
          }
          renderItem={({ item }) => {
            const isPlaying = item.fileUrl === currentAudioUrl && !paused;
            return (
              <View style={styles.card}>
                <View style={styles.cardContent}>
                  <Text style={styles.fileName}>{item.fileName}</Text>
                  <View style={styles.statusRow}>
                    {getStatusIcon(item.status)}
                    <Text style={styles.statusText}> {item.status}</Text>
                  </View>
                  <Text style={styles.detail}>Location: {item.location || 'Unknown'}</Text>
                  <Text style={styles.detail}>
                    Uploaded: {item.uploadedAt?.seconds
                      ? moment(item.uploadedAt.seconds * 1000).format('DD MMM YYYY, hh:mm A')
                      : 'N/A'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.playButton, { backgroundColor: isPlaying ? '#f44336' : '#4CAF50' }]}
                  onPress={() => handlePlayPause(item.fileUrl)}
                >
                  <Text style={styles.playButtonText}>
                    {isPlaying ? 'Pause' : 'Play'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* 🔥 Audio Player */}
      {currentAudioUrl && (
        <Video
          source={{ uri: currentAudioUrl }}
          paused={paused}
          audioOnly={true}
          onEnd={() => {
            setCurrentAudioUrl(null);
            setPaused(true);
          }}
          onError={(e) => console.error('Audio playback error:', e)}
          style={{ height: 0, width: 0 }}
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
    flex: 1,
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
