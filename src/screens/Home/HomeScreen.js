import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { getFirestore, collection, getDocs } from '@react-native-firebase/firestore';
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
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const db = getFirestore(getApp());
      const audioQuery = collection(db, 'voice_recordings');
      const snapshot = await getDocs(audioQuery);

      const list = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          from: data.from,
          recordingUrl: data.recordingUrl,
          timestamp: data.timestamp,
        };
      });

      setAudioList(list);
    } catch (error) {
      console.error('Error fetching audio files:', error.message);
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false);
    }
  };

  const handlePlayPause = (audioUrl) => {
    if (currentAudioUrl === audioUrl) {
      setPaused(!paused);
    } else {
      setCurrentAudioUrl(audioUrl);
      setPaused(false);
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
      <Text style={styles.title}>Incoming Voice Recordings</Text>

      {audioList.length === 0 ? (
        <Text>No audio recordings found.</Text>
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
            const isPlaying = item.recordingUrl === currentAudioUrl && !paused;
            return (
              <View style={styles.card}>
                <View style={styles.cardContent}>
                  <Text style={styles.fileName}>From: {item.from}</Text>
                  <Text style={styles.detail}>
                    Received: {item.timestamp
                      ? moment(item.timestamp).format('DD MMM YYYY, hh:mm A')
                      : 'Unknown'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.playButton, { backgroundColor: isPlaying ? '#f44336' : '#4CAF50' }]}
                  onPress={() => handlePlayPause(item.recordingUrl)}
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
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
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
