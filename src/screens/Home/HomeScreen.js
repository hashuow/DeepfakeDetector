import React, { useEffect, useState, useContext, useCallback } from 'react'; // Added useCallback
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, StyleSheet, RefreshControl, ToastAndroid, Platform
} from 'react-native';
import moment from 'moment';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Menu, Button, Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native'; // Added useNavigation, useRoute, useFocusEffect
import { fetchAudioFilesFromDB } from '../../database/firestoreDB';
import { AuthContext } from '../../navigation/AppNavigator';


const IOSColors = {
  background: '#F2F2F7',
  listItemBackground: '#FFFFFF',
  textPrimary: '#000000',
  textSecondary: '#8E8E93',
  textBlue: '#007AFF',
  separator: '#C6C6C8',
  fakeRed: '#FF3B30',
  verifiedGreen: '#34C759',
  playButtonBackground: '#EFEFF4',
};

const theme = {
  ...DefaultTheme,
  roundness: 8,
  colors: {
    ...DefaultTheme.colors,
    primary: IOSColors.textBlue,
    accent: IOSColors.textBlue,
    background: IOSColors.background,
    text: IOSColors.textPrimary,
    placeholder: IOSColors.textSecondary,
  },
};

const HomeScreen = () => {
  const navigation = useNavigation(); // For clearing params
  const route = useRoute(); // For accessing params
  const { username } = useContext(AuthContext);

  const [audioList, setAudioList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState(null);
  const [paused, setPaused] = useState(true);
  const [activePlayingId, setActivePlayingId] = useState(null);

  const [filterFrom, setFilterFrom] = useState('all');
  const [filterPrediction, setFilterPrediction] = useState('all'); // This will be updated by params
  const [sortOrder, setSortOrder] = useState('desc');

  const [menuVisible, setMenuVisible] = useState({
    from: false,
    prediction: false,
    sort: false,
  });

  // Apply filter from navigation parameters when the screen focuses
  useFocusEffect(
    useCallback(() => {
      const newFilter = route.params?.preFilter;
      if (newFilter !== undefined) { // Check if preFilter is explicitly passed
        console.log('[HomeScreen] Received preFilter parameter:', newFilter);
        if (newFilter !== filterPrediction) { // Only update if it's different
            setFilterPrediction(newFilter);
        }
        navigation.setParams({ preFilter: undefined });
      }
      
    }, [route.params?.preFilter, navigation, filterPrediction]) 
  );


  useEffect(() => {
    
    if (loading) { // Only fetch initially if loading is true
        fetchAudioFiles();
    }
  }, [loading]); 

  

  const fetchAudioFiles = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      console.log('[HomeScreen] Fetching audio files...');
      const list = await fetchAudioFilesFromDB(username);
      const updatedList = list.map(item => ({ ...item, location: item.location || 'Australia' }));
      setAudioList(updatedList);
      if (isRefresh && Platform.OS === 'android') {
        ToastAndroid.show('Refreshed', ToastAndroid.SHORT);
      }
    } catch (error) {
      console.error('[HomeScreen] Fetch Error:', error.message);
      ToastAndroid.show('Error fetching calls', ToastAndroid.SHORT)
    } finally {
      if (isRefresh) setRefreshing(false);
      setLoading(false); 
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

  const openMenu = (menu) => setMenuVisible(prev => ({ ...prev, [menu]: true }));
  const closeMenu = (menu) => setMenuVisible(prev => ({ ...prev, [menu]: false }));

  const applyFilters = useCallback(() => { // useCallback for applyFilters
    console.log('[HomeScreen] Applying filters with prediction:', filterPrediction, 'and from:', filterFrom);
    let filtered = [...audioList];
    if (filterFrom !== 'all') {
      filtered = filtered.filter(item => item.from === filterFrom);
    }

    // Handle 'verified' to include 'real' if that's the intent
    if (filterPrediction !== 'all') {
      if (filterPrediction === 'verified') {
        filtered = filtered.filter(item => item.prediction === 'real' || item.prediction === 'verified');
      } else {
        filtered = filtered.filter(item => item.prediction === filterPrediction);
      }
    }
    // console.log('[HomeScreen] Filtered list count before sort:', filtered.length);
    return filtered.sort((a, b) => {
      const t1 = a.timestamp?.toDate?.() ?? new Date(a.timestamp);
      const t2 = b.timestamp?.toDate?.() ?? new Date(b.timestamp);
      return sortOrder === 'desc' ? t2 - t1 : t1 - t2;
    });
  }, [audioList, filterFrom, filterPrediction, sortOrder]); 

  const filteredList = applyFilters(); 
  const allCallers = ['all', ...new Set(audioList.map(item => item.from))];

  // Ensure button text updates when filterPrediction changes
  const fromButtonText = filterFrom === 'all' ? 'Caller' : (filterFrom.length > 10 ? filterFrom.substring(0,8)+'...' : filterFrom);
  const statusButtonText = filterPrediction === 'all' ? 'Status' : filterPrediction.charAt(0).toUpperCase() + filterPrediction.slice(1);
  const sortButtonText = sortOrder === 'desc' ? 'Newest' : 'Oldest';

  if (loading && audioList.length === 0) { // Show loading only if data isn't there yet
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={IOSColors.textBlue} />
        <Text style={styles.loadingText}>Loading Calls...</Text>
      </View>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <View style={styles.container}>
        <View style={styles.filterBar}>
          <Menu
            visible={menuVisible.from}
            onDismiss={() => closeMenu('from')}
            anchor={
              <Button
                onPress={() => openMenu('from')}
                mode="text"
                style={styles.filterButton}
                labelStyle={styles.filterButtonLabel}
                uppercase={false}
                compact
              >
                {fromButtonText}
              </Button>
            }>
            {allCallers.map(caller => (
              <Menu.Item key={caller} onPress={() => { setFilterFrom(caller); closeMenu('from'); }} title={caller} />
            ))}
          </Menu>
          <Menu
            visible={menuVisible.prediction}
            onDismiss={() => closeMenu('prediction')}
            anchor={
              <Button
                onPress={() => openMenu('prediction')}
                mode="text"
                style={styles.filterButton}
                labelStyle={styles.filterButtonLabel}
                uppercase={false}
                compact
              >
                {statusButtonText}
              </Button>
            }>
            <Menu.Item onPress={() => { setFilterPrediction('all'); closeMenu('prediction'); }} title="All" />
            <Menu.Item onPress={() => { setFilterPrediction('fake'); closeMenu('prediction'); }} title="Fake" />
            <Menu.Item onPress={() => { setFilterPrediction('verified'); closeMenu('prediction'); }} title="Verified / Real" />
          </Menu>
          <Menu
            visible={menuVisible.sort}
            onDismiss={() => closeMenu('sort')}
            anchor={
              <Button
                onPress={() => openMenu('sort')}
                mode="text"
                style={styles.filterButton}
                labelStyle={styles.filterButtonLabel}
                uppercase={false}
                compact
              >
                {sortButtonText}
              </Button>
            }>
            <Menu.Item onPress={() => { setSortOrder('desc'); closeMenu('sort'); }} title="Newest First" />
            <Menu.Item onPress={() => { setSortOrder('asc'); closeMenu('sort'); }} title="Oldest First" />
          </Menu>
        </View>

        {filteredList.length === 0 && !loading && (
          <View style={styles.emptyStateContainer}>
            <Icon name="phone-remove-outline" size={60} color={IOSColors.textSecondary} />
            <Text style={styles.emptyStateText}>No Call History</Text>
            <Text style={styles.emptyStateSubText}>
              {filterPrediction !== 'all' || filterFrom !== 'all' ? "Try adjusting your filters." : "Calls will appear here once available."}
            </Text>
          </View>
        )}

        <FlatList
          data={filteredList}
          keyExtractor={(item) => item.id.toString()}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchAudioFiles(true)} // Call fetch with isRefresh = true
              colors={[IOSColors.textBlue]}
              tintColor={IOSColors.textBlue}
            />
          }
          renderItem={({ item }) => {
            const isPlaying = activePlayingId === item.id && currentAudioUrl === item.recordingUrl && !paused;
            const isFake = item.prediction === 'fake';
            // Consolidate 'real' and 'verified' for display logic if needed
            const isActuallyVerified = item.prediction === 'real' || item.prediction === 'verified';
            const time = item.timestamp?.toDate?.() ?? new Date(item.timestamp);
            const displayTime = moment(time).format('MMM D, h:mm A');

            return (
              <View style={styles.listItemContainer}>
                <View style={styles.infoContainer}>
                  <Text style={styles.callerText} numberOfLines={1} ellipsizeMode="tail">
                    {item.from}
                  </Text>
                  <View style={styles.secondaryInfoRow}>
                    {isFake ? (
                        <Icon name="alert-circle-outline" size={14} color={IOSColors.fakeRed} style={styles.statusIcon} />
                    ) : ( // If not fake, then it's 'real' or 'verified'
                        <Icon name="check-circle-outline" size={14} color={IOSColors.verifiedGreen} style={styles.statusIcon} />
                    )}
                    <Text style={[styles.statusText, { color: isFake ? IOSColors.fakeRed : IOSColors.verifiedGreen }]}>
                      {isFake ? 'Fake Call' : 'Verified'}
                    </Text>
                    <Text style={styles.dotSeparator}>•</Text>
                    <Text style={styles.timestampText}>{displayTime}</Text>
                  </View>
                   {item.location && typeof item.location === 'string' ? (
                    <View style={styles.locationRow}>
                        <Icon name="map-marker-outline" size={14} color={IOSColors.textSecondary} style={styles.statusIcon}/>
                        <Text style={styles.locationText} numberOfLines={1} ellipsizeMode="tail">{item.location}</Text>
                    </View>
                   ) : null}
                </View>

                <TouchableOpacity
                  style={styles.playButton}
                  onPress={() => handlePlayPause(item.id, item.recordingUrl)}
                >
                  <Icon
                    name={isPlaying ? "pause-circle" : "play-circle-outline"}
                    size={30}
                    color={IOSColors.textBlue}
                  />
                </TouchableOpacity>
              </View>
            );
          }}
        />

        {currentAudioUrl && (
          <Video
            key={activePlayingId + currentAudioUrl} // More robust key for re-initialization
            source={{ uri: currentAudioUrl }}
            paused={paused} audioOnly playInBackground={false} playWhenInactive={false}
            onEnd={() => {
                console.log('Audio playback finished');
                setPaused(true);
                // setActivePlayingId(null); // Optional: reset if you don't want to replay
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

// Styles (copied from your provided HomeScreen code)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOSColors.background,
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: IOSColors.background,
    borderBottomWidth: 0.5,
    borderBottomColor: IOSColors.separator,
  },
  filterButton: {
    paddingHorizontal: 8,
  },
  filterButtonLabel: {
    fontSize: 15,
    color: IOSColors.textBlue,
    fontWeight: '400',
    letterSpacing: -0.2,
    textTransform: 'none',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: IOSColors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 17,
    color: IOSColors.textSecondary,
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: IOSColors.background,
  },
  emptyStateText: {
    fontSize: 22,
    fontWeight: '500',
    color: IOSColors.textPrimary,
    marginTop: 20,
    textAlign: 'center',
  },
  emptyStateSubText: {
    fontSize: 16,
    color: IOSColors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  listItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOSColors.listItemBackground,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  callerText: {
    fontSize: 17,
    fontWeight: '400',
    color: IOSColors.textPrimary,
    marginBottom: 2,
  },
  secondaryInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 13,
    marginRight: 6,
  },
  dotSeparator: {
    fontSize: 13,
    color: IOSColors.textSecondary,
    marginHorizontal: 0,
    paddingBottom: 2,
  },
  timestampText: {
    fontSize: 13,
    color: IOSColors.textSecondary,
    marginLeft: 6,
  },
  locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
  },
  locationText: {
      fontSize: 13,
      color: IOSColors.textSecondary,
  },
  playButton: {
    paddingLeft: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    height: 0.5,
    backgroundColor: IOSColors.separator,
    marginLeft: 16,
  },
});