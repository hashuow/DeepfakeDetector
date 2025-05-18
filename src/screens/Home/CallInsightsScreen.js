// CallInsightsScreen.js
import React, { useState, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Avatar, Title, Paragraph } from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'; 
import { AuthContext } from '../../navigation/AppNavigator'; 
import { fetchAudioFilesFromDB } from '../../database/firestoreDB'; 
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; 

const screenWidth = Dimensions.get('window').width;
const cardPadding = 16;

const ExampleInspiredColors = {
  background: '#F0F4F8',
  headerBackground: '#00AEEF',
  headerText: '#FFFFFF',
  cardBackground: '#FFFFFF',
  textPrimary: '#1D2C3C',
  textSecondary: '#5A6A7A',
  accentBlue: '#00AEEF',
  accentGreen: '#2ECC71',
  accentRed: '#E74C3C',
  borderLight: '#E1E8ED',
  legendText: '#5A6A7A',
  avatarBackground: '#00AEEF',
  avatarText: '#FFFFFF',
  topSenderBarColor: '#00AEEF',
  progressTrackColor: '#E0E0E0',
};

// Default map region (Australia)
const AUSTRALIA_COORDS = {
  latitude: -25.2744,
  longitude: 133.7751,
  latitudeDelta: 30,
  longitudeDelta: 30,
};

// Demo markers for the map
const demoMarkers = [
  { id: '1', coordinate: { latitude: -33.8688, longitude: 151.2093 }, title: 'Sydney, NSW', description: 'Call activity observed.' },
  // { id: '2', coordinate: { latitude: -37.8136, longitude: 144.9631 }, title: 'Melbourne, VIC', description: 'Call activity observed.' },
  // Add more markers based on actual or aggregated data if available
];

const CallInsightsScreen = () => {
  const navigation = useNavigation(); // Hook for navigation
  const { username } = useContext(AuthContext); // Get username from context

  // State variables
  const [summary, setSummary] = useState({ total: 0, real: 0, fake: 0, topCallers: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mapError, setMapError] = useState(null); // State for map loading errors

  // StatCard component for displaying individual statistics
  const StatCard = ({ title, value, iconName, iconColor, isSmall = false, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.statCard,
        isSmall ? styles.statCardSmall : styles.statCardLarge,
      ]}
      activeOpacity={0.7} // Visual feedback on touch
    >
      <View style={styles.statCardHeader}>
        <Icon name={iconName} size={isSmall ? 20 : 24} color={iconColor || ExampleInspiredColors.textSecondary} />
        <Text style={[styles.statCardTitle, isSmall && styles.statCardTitleSmall]}>{title}</Text>
      </View>
      <Text style={[styles.statCardValue, isSmall && styles.statCardValueSmall]}>{value}</Text>
    </TouchableOpacity>
  );

  // Function to load summary data
  const loadSummary = useCallback(async () => {
    if (!refreshing) setLoading(true); // Show loading indicator if not a pull-to-refresh
    setMapError(null); // Reset map error state

    try {
      const data = await fetchAudioFilesFromDB(username); // Fetch data
      if (!data || data.length === 0) {
        // Handle case with no data
        setSummary({ total: 0, real: 0, fake: 0, topCallers: [] });
        setMapError("No call data to analyze."); // Inform user if map cannot be populated
        setLoading(false); setRefreshing(false); return;
      }

      // Process data to calculate summary statistics
      const realCount = data.filter(i => i.prediction === 'real' || i.prediction === 'verified').length;
      const fakeCount = data.filter(i => i.prediction === 'fake').length;

      const counts = {}; // For top callers
      data.forEach(i => counts[i.from] = (counts[i.from] || 0) + 1);
      const topCallers = Object.entries(counts)
                            .sort(([, a], [, b]) => b - a) // Sort by call count descending
                            .slice(0, 5) // Take top 5
                            .map(([from, count]) => ({ from, count }));

      setSummary({ total: data.length, real: realCount, fake: fakeCount, topCallers });
    } catch (err) {
      console.error("Error loading insights:", err);
      Alert.alert('Error', 'Failed to load insights. Please pull to refresh.');
      setMapError("Error fetching call data."); // Set map error on fetch failure
    } finally {
      setLoading(false); // Hide loading indicator
      setRefreshing(false); // Hide refresh indicator if it was a pull-to-refresh
    }
  }, [username, refreshing]); // Dependencies for useCallback

  // Load summary when the screen comes into focus
  useFocusEffect(useCallback(() => { loadSummary(); }, [loadSummary]));

  // Handler for pull-to-refresh
  const onRefresh = useCallback(() => setRefreshing(true), []);

  // Calculate percentages for progress display
  const totalCallsForPercentage = summary.real + summary.fake;
  const realPercentage = totalCallsForPercentage > 0 ? Math.round((summary.real / totalCallsForPercentage) * 100) : 0;
  const fakePercentage = totalCallsForPercentage > 0 ? (100 - realPercentage) : 0; // Or Math.round((summary.fake / totalCallsForPercentage) * 100)

  // Loading state UI
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ExampleInspiredColors.accentBlue} />
        <Text style={styles.loadingText}>Loading Insights...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[ExampleInspiredColors.accentBlue]} // Android refresh color
          tintColor={ExampleInspiredColors.accentBlue} // iOS refresh color
        />
      }
    >
      {/* Header Section */}
      <View style={styles.headerContainer}>
        <Title style={styles.headerTitle}>Overview</Title>
        <Paragraph style={styles.headerSubtitle}>You are viewing {username}'s call insights</Paragraph>
      </View>

      {/* Statistics Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          title="Total Calls"
          value={summary.total}
          iconName="phone-log-outline"
          iconColor={ExampleInspiredColors.accentBlue}
          // CORRECTED NAVIGATION: Navigate directly to "Call History" screen
          onPress={() => navigation.navigate('Call History', { preFilter: 'all' })}
        />
        <StatCard
          title="Real Call Rate" // Consider if "Verified Call Rate" is more accurate
          value={`${realPercentage}%`}
          iconName="chart-pie" // Or "shield-check-outline"
          iconColor={ExampleInspiredColors.accentGreen}
          // CORRECTED NAVIGATION:
          onPress={() => navigation.navigate('Call History', { preFilter: 'verified' })}
        />
      </View>
      <View style={styles.statsGrid}>
        <StatCard
          title="Verified Calls" // Changed from "Real Calls" for consistency if 'verified' is the main term
          value={summary.real}
          iconName="check-circle-outline"
          iconColor={ExampleInspiredColors.accentGreen}
          isSmall
          // CORRECTED NAVIGATION:
          onPress={() => navigation.navigate('Call History', { preFilter: 'verified' })}
        />
        <StatCard
          title="Fake Calls"
          value={summary.fake}
          iconName="alert-octagon-outline"
          iconColor={ExampleInspiredColors.accentRed}
          isSmall
          // CORRECTED NAVIGATION:
          onPress={() => navigation.navigate('Call History', { preFilter: 'fake' })}
        />
      </View>

      {/* Map Section */}
      <View style={styles.customCard}>
        <Title style={styles.sectionTitle}>Call Origin Overview</Title>
        <View style={styles.mapContainer}>
          {mapError ? (
            // Display placeholder if map fails or no data
            <View style={styles.mapPlaceholder}>
              <Icon name="map-marker-alert-outline" size={40} color={ExampleInspiredColors.textSecondary} />
              <Text style={styles.mapPlaceholderText}>{mapError}</Text>
              <Text style={styles.mapPlaceholderSubText}>
                {mapError.includes("No call data") ? "Map will populate once calls are logged." : "Map component might have issues." }
              </Text>
            </View>
          ) : (
            <MapView
              provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined} // Use Google Maps on Android
              style={styles.map}
              initialRegion={AUSTRALIA_COORDS} // Default view region
              scrollEnabled={false} // Disable map interactions for overview
              zoomEnabled={false}

            >
              {/* Render markers on the map */}
              {demoMarkers.map((marker) => (
                <Marker
                  key={marker.id || marker.title} // Ensure unique key
                  coordinate={marker.coordinate}
                  title={marker.title}
                  description={marker.description}
                  pinColor={ExampleInspiredColors.accentBlue} // Consistent pin color
                />
              ))}
            </MapView>
          )}
        </View>
      </View>

      {/* Call Analysis Section (Progress bars and Top Senders) */}
      {(totalCallsForPercentage > 0 || summary.topCallers.length > 0) && (
        <View style={styles.customCard}>
          <Title style={styles.sectionTitle}>Call Analysis</Title>

          {/* Proportion of Real vs Fake Calls */}
          {totalCallsForPercentage > 0 && (
            <View style={styles.callProportionSection}>
              <View style={styles.progressContainer}>
                {summary.real > 0 && <View style={[styles.progressSegment, { width: `${realPercentage}%`, backgroundColor: ExampleInspiredColors.accentGreen }]} />}
                {summary.fake > 0 && <View style={[styles.progressSegment, { width: `${fakePercentage}%`, backgroundColor: ExampleInspiredColors.accentRed }]} />}
              </View>
              <View style={styles.progressLegendContainer}>
                <View style={styles.legendItemRow}>
                  <View style={[styles.legendColorBox, {backgroundColor: ExampleInspiredColors.accentGreen}]} />
                  <Text style={styles.legendItemText}>{realPercentage}% Verified ({summary.real})</Text>
                </View>
                <View style={styles.legendItemRow}>
                  <View style={[styles.legendColorBox, {backgroundColor: ExampleInspiredColors.accentRed}]} />
                  <Text style={styles.legendItemText}>{fakePercentage}% Fake ({summary.fake})</Text>
                </View>
              </View>
            </View>
          )}

          {/* Top Senders List */}
          {summary.topCallers.length > 0 && (
            <>
              <Title style={[styles.sectionTitle, styles.subSectionTitle]}>Top Senders</Title>
              {summary.topCallers.map((caller, index) => (
                <View style={styles.topSenderItem} key={caller.from + index}>
                  <Text style={styles.topSenderName} numberOfLines={1} ellipsizeMode="tail">{caller.from}</Text>
                  <View style={styles.topSenderCountAndBarWrapper}>
                    <Text style={styles.topSenderCount}>{caller.count}</Text>
                    <View style={styles.topSenderBarContainer}>
                        <View style={[
                            styles.topSenderBar,
                            // Calculate bar width relative to the top caller's count
                            { width: `${Math.min(100, (caller.count / Math.max(1, summary.topCallers[0].count)) * 100)}%` }
                          ]}
                        />
                    </View>
                  </View>
                </View>
              ))}
            </>
          )}
        </View>
      )}
      {/* Fallback for no data at all */}
      {summary.total === 0 && !loading && (
         <View style={styles.customCard}>
            <Text style={styles.noDataText}>No call insights available yet. Start receiving calls to see your statistics!</Text>
         </View>
      )}
    </ScrollView>
  );
};

export default CallInsightsScreen;

// Styles (using ExampleInspiredColors palette)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ExampleInspiredColors.background,
  },
  contentContainer: {
    paddingBottom: 30, // Space at the bottom of the scroll view
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ExampleInspiredColors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: ExampleInspiredColors.textSecondary,
  },
  headerContainer: {
    backgroundColor: ExampleInspiredColors.headerBackground,
    paddingHorizontal: cardPadding,
    paddingTop: Platform.OS === 'ios' ? 50 : 20, // Adjust for status bar
    paddingBottom: 20,
    marginBottom: cardPadding,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: ExampleInspiredColors.headerText,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: ExampleInspiredColors.headerText,
    opacity: 0.85,
  },
  customCard: {
    backgroundColor: ExampleInspiredColors.cardBackground,
    borderRadius: 12,
    padding: cardPadding,
    marginHorizontal: cardPadding,
    marginBottom: cardPadding,
    // Shadow for iOS, Elevation for Android
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.00,
    elevation: 1,
    borderWidth: Platform.OS === 'ios' ? 0 : StyleSheet.hairlineWidth, // Minimal border for Android if elevation is subtle
    borderColor: ExampleInspiredColors.borderLight,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: ExampleInspiredColors.textPrimary,
    marginBottom: 12,
  },
  subSectionTitle: { // For titles within a card, like "Top Senders"
    fontSize: 16,
    fontWeight: '500',
    color: ExampleInspiredColors.textPrimary,
    marginTop: 20, // Space above if following another element in the card
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: cardPadding,
    marginBottom: cardPadding,
  },
  statCard: { // Style for the TouchableOpacity wrapper of StatCard
    backgroundColor: ExampleInspiredColors.cardBackground,
    borderRadius: 12,
    padding: 12,
    alignItems: 'flex-start', // Align content to the start
    // Shadow/Elevation for StatCard
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1, },
    shadowOpacity: 0.15,
    shadowRadius: 1.00,
    elevation: 1,
    borderWidth: Platform.OS === 'ios' ? 0 : StyleSheet.hairlineWidth,
    borderColor: ExampleInspiredColors.borderLight,
  },
  statCardLarge: {
    flex: 0.48, // Adjust flex to fit two cards per row with spacing
  },
  statCardSmall: {
    flex: 0.48,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statCardTitle: {
    fontSize: 14,
    color: ExampleInspiredColors.textSecondary,
    marginLeft: 8,
    fontWeight: '500',
  },
  statCardTitleSmall: {
    fontSize: 13,
  },
  statCardValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: ExampleInspiredColors.textPrimary,
  },
  statCardValueSmall: {
    fontSize: 22,
  },
  mapContainer: {
    height: 200,
    borderRadius: 8,
    overflow: 'hidden', // Important for borderRadius to apply to MapView
    marginTop: 8,
    borderWidth: 1,
    borderColor: ExampleInspiredColors.borderLight, // Border around map
  },
  map: {
    ...StyleSheet.absoluteFillObject, // MapView takes full space of its container
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E9ECEF', // A light placeholder background
    padding: 10,
  },
  mapPlaceholderText: {
    marginTop: 10,
    fontSize: 15,
    color: ExampleInspiredColors.textSecondary,
    textAlign: 'center',
  },
  mapPlaceholderSubText: {
    fontSize: 12,
    color: ExampleInspiredColors.textSecondary,
    marginTop: 5,
    textAlign: 'center',
  },
  callProportionSection: {
    marginBottom: 20, // Space below the proportion display
  },
  progressContainer: {
    flexDirection: 'row',
    height: 20, // Or 24 for a thicker bar
    borderRadius: 10, // Half of height for fully rounded ends
    backgroundColor: ExampleInspiredColors.progressTrackColor, // Background of the track
    overflow: 'hidden', // Ensures segments stay within rounded corners
    marginTop: 8,
    marginBottom: 8,
  },
  progressSegment: {
    height: '100%', // Segments fill the height of the container
  },
  progressLegendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Distribute legend items
    marginTop: 8,
    paddingHorizontal: 5,
  },
  legendItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColorBox: {
    width: 10, // Or 12
    height: 10, // Or 12
    borderRadius: 2, // Slightly rounded box
    marginRight: 6,
  },
  legendItemText: {
    fontSize: 13,
    color: ExampleInspiredColors.legendText,
  },
  topSenderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, // Subtle separator
    borderBottomColor: ExampleInspiredColors.borderLight,
  },
  topSenderName: {
    fontSize: 14,
    color: ExampleInspiredColors.textPrimary,
    flexShrink: 1, // Allow name to shrink if count/bar is wide
    marginRight: 10,
  },
  topSenderCountAndBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topSenderCount: {
    fontSize: 14,
    fontWeight: '500',
    color: ExampleInspiredColors.textPrimary,
    minWidth: 25, // Ensure count has some space
    textAlign: 'right',
    marginRight: 8,
  },
  topSenderBarContainer: {
    width: 80, // Fixed width for the bar background
    height: 8,
    backgroundColor: ExampleInspiredColors.progressTrackColor, // Background for the bar
    borderRadius: 4,
    overflow: 'hidden',
  },
  topSenderBar: {
    height: '100%',
    backgroundColor: ExampleInspiredColors.topSenderBarColor, // Color of the actual bar
    borderRadius: 4,
  },
  noDataText: {
    fontSize: 14,
    color: ExampleInspiredColors.textSecondary,
    textAlign: 'center',
    paddingVertical: 20, // Give it some space
  },
});
