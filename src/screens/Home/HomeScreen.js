import React, { useEffect, useState, useContext } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, StyleSheet, RefreshControl, ToastAndroid, Platform
} from 'react-native';
import moment from 'moment';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Menu, Divider, Button, Provider as PaperProvider } from 'react-native-paper';
import { fetchAudioFilesFromDB } from '../../database/firestoreDB';
import { AuthContext } from '../../navigation/AppNavigator';

const HomeScreen = () => {
  const [audioList, setAudioList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState(null);
  const [paused, setPaused] = useState(true);
  const [activePlayingId, setActivePlayingId] = useState(null);

  const [filterFrom, setFilterFrom] = useState('all');
  const [filterPrediction, setFilterPrediction] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');
  const [menuVisible, setMenuVisible] = useState({ from: false, prediction: false, sort: false });

  const { username } = useContext(AuthContext);

  useEffect(() => {
    fetchAudioFiles();
  }, []);

  const fetchAudioFiles = async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const list = await fetchAudioFilesFromDB(username);
      setAudioList(list);
      if (isRefresh && Platform.OS === 'android') {
        ToastAndroid.show('✅ Refreshed', ToastAndroid.SHORT);
      }
    } catch (error) {
      console.error('Fetch Error:', error.message);
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false);
    }
  };

  const handlePlayPause = (id, audioUrl) => {
    if (activePlayingId === id && currentAudioUrl === audioUrl) {
      setPaused(!paused);
    } else {
      setPaused(true);
      setCurrentAudioUrl(null);
      setTimeout(() => {
        setCurrentAudioUrl(audioUrl);
        setPaused(false);
        setActivePlayingId(id);
      }, 100);
    }
  };

  const applyFilters = () => {
    let filtered = [...audioList];
    if (filterFrom !== 'all') filtered = filtered.filter(item => item.from === filterFrom);
    if (filterPrediction !== 'all') filtered = filtered.filter(item => item.prediction === filterPrediction);
    return filtered.sort((a, b) => {
      const t1 = a.timestamp?.toDate?.() ?? a.timestamp;
      const t2 = b.timestamp?.toDate?.() ?? b.timestamp;
      return sortOrder === 'desc' ? t2 - t1 : t1 - t2;
    });
  };

  const filteredList = applyFilters();
  const allCallers = [...new Set(audioList.map(item => item.from))];

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading audio files...</Text>
      </View>
    );
  }

  return (
    <PaperProvider>
      <View style={styles.container}>
        <View style={styles.filterBar}>
          <Menu
            visible={menuVisible.from}
            onDismiss={() => setMenuVisible(p => ({ ...p, from: false }))}
            anchor={
              <Button mode="outlined" onPress={() => setMenuVisible(p => ({ ...p, from: true }))}>
                {filterFrom === 'all' ? 'All Callers' : filterFrom}
              </Button>
            }>
            <Menu.Item onPress={() => setFilterFrom('all')} title="All Callers" />
            <Divider />
            {allCallers.map(from => (
              <Menu.Item key={from} onPress={() => setFilterFrom(from)} title={from} />
            ))}
          </Menu>

          <Menu
            visible={menuVisible.prediction}
            onDismiss={() => setMenuVisible(p => ({ ...p, prediction: false }))}
            anchor={
              <Button mode="outlined" onPress={() => setMenuVisible(p => ({ ...p, prediction: true }))}>
                {filterPrediction === 'all' ? 'All' : filterPrediction === 'fake' ? 'Fake' : 'Real'}
              </Button>
            }>
            <Menu.Item onPress={() => setFilterPrediction('all')} title="All" />
            <Menu.Item onPress={() => setFilterPrediction('real')} title="Real" />
            <Menu.Item onPress={() => setFilterPrediction('fake')} title="Fake" />
          </Menu>

          <Menu
            visible={menuVisible.sort}
            onDismiss={() => setMenuVisible(p => ({ ...p, sort: false }))}
            anchor={
              <Button mode="outlined" onPress={() => setMenuVisible(p => ({ ...p, sort: true }))}>
                {sortOrder === 'desc' ? 'Latest' : 'Oldest'}
              </Button>
            }>
            <Menu.Item onPress={() => setSortOrder('desc')} title="Latest First" />
            <Menu.Item onPress={() => setSortOrder('asc')} title="Oldest First" />
          </Menu>
        </View>

        <FlatList
          data={filteredList}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchAudioFiles(true)}
              colors={['#4CAF50']}
            />
          }
          renderItem={({ item }) => {
            const isPlaying = activePlayingId === item.id && currentAudioUrl === item.recordingUrl && !paused;
            const isFake = item.prediction === 'fake';
            const time = item.timestamp?.toDate?.() ?? item.timestamp;
            const displayTime = moment(time).format('DD MMM YYYY, hh:mm A');

            return (
              <View style={styles.card}>
                <View style={styles.cardContent}>
                  <Text style={styles.fileName}>From: {item.from}</Text>
                  <Text style={styles.detail}>Received: {displayTime}</Text>
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
                  style={[styles.playButton, { backgroundColor: isPlaying ? '#f44336' : '#4CAF50' }]}
                  onPress={() => handlePlayPause(item.id, item.recordingUrl)}
                >
                  <Text style={styles.playButtonText}>{isPlaying ? 'Pause' : 'Play'}</Text>
                </TouchableOpacity>
              </View>
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />

        {currentAudioUrl && (
          <Video
            key={activePlayingId}
            source={{ uri: currentAudioUrl }}
            paused={paused}
            audioOnly
            onEnd={() => {
              setCurrentAudioUrl(null);
              setPaused(true);
              setActivePlayingId(null);
            }}
            onError={(e) => console.error('Audio error:', e)}
            style={{ height: 0, width: 0 }}
          />
        )}
      </View>
    </PaperProvider>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: '#ffffff',
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 6,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  predictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  playButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 10,
  },
  playButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  separator: {
    height: 10,
  },
});
