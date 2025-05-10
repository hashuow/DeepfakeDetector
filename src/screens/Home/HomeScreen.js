import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  ToastAndroid,
  Platform,
} from 'react-native';
import moment from 'moment';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { fetchAudioFilesFromDB } from '../../database/firestoreDB';
import { AuthContext } from '../../navigation/AppNavigator';

const HomeScreen = () => {
  const [audioList, setAudioList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState(null);
  const [paused, setPaused] = useState(true);

  const { username } = useContext(AuthContext);

  useEffect(() => {
    console.log("📌 Logged in as:", username);
    fetchAudioFiles();
  }, []);

  const fetchAudioFiles = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const list = await fetchAudioFilesFromDB(username);
      setAudioList(list);

      if (isRefresh) {
        console.log("🔄 Audio list refreshed.");
        if (Platform.OS === 'android') {
          ToastAndroid.show("✅ Refreshed", ToastAndroid.SHORT);
        }
      }
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
      <Text style={styles.subtitle}>User: {username}</Text>

      {audioList.length === 0 ? (
        <Text>No audio recordings found.</Text>
      ) : (
        <FlatList
          data={audioList}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                console.log("🔁 Pull-to-refresh triggered");
                fetchAudioFiles(true);
              }}
              colors={['#4CAF50']}
            />
          }
          contentContainerStyle={{ flexGrow: 1 }}
          renderItem={({ item }) => {
            const isPlaying = item.recordingUrl === currentAudioUrl && !paused;
            const isFake = item.prediction === 'fake';

            return (
              <View style={styles.card}>
                <View style={styles.cardContent}>
                  <Text style={styles.fileName}>From: {item.from}</Text>
                  <Text style={styles.detail}>
                    Received: {item.timestamp
                      ? moment(item.timestamp).format('DD MMM YYYY, hh:mm A')
                      : 'Unknown'}
                  </Text>
                  <View style={styles.predictionRow}>
                    <Icon
                      name={isFake ? 'alert-octagon-outline' : 'shield-check-outline'}
                      size={18}
                      color={isFake ? '#e53935' : '#4CAF50'}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={{ color: isFake ? '#e53935' : '#4CAF50', fontWeight: 'bold' }}>
                      {isFake ? 'Fake Voice Detected' : 'Verified Voice'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.playButton,
                    { backgroundColor: isPlaying ? '#f44336' : '#4CAF50' }
                  ]}
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
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
  predictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
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
