import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Card, Title, Paragraph, Avatar } from 'react-native-paper';
import { PieChart } from 'react-native-chart-kit';
import { AuthContext } from '../../navigation/AppNavigator';
import { fetchAudioFilesFromDB } from '../../database/firestoreDB';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const screenWidth = Dimensions.get('window').width;

const CallInsightsScreen = () => {
  const { username } = useContext(AuthContext);
  const [summary, setSummary] = useState({
    total: 0,
    real: 0,
    fake: 0,
    topCallers: [],
  });

  useEffect(() => {
    const loadSummary = async () => {
      const data = await fetchAudioFilesFromDB(username);
      const real = data.filter(i => i.prediction === 'real').length;
      const fake = data.filter(i => i.prediction === 'fake').length;

      const counts = {};
      data.forEach(i => {
        counts[i.from] = (counts[i.from] || 0) + 1;
      });

      const topCallers = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([from, count]) => ({ from, count }));

      setSummary({
        total: data.length,
        real,
        fake,
        topCallers,
      });
    };

    loadSummary();
  }, [username]);

  const chartData = [
    {
      name: 'Real',
      population: summary.real,
      color: '#4CAF50',
      legendFontColor: '#333',
      legendFontSize: 14,
    },
    {
      name: 'Fake',
      population: summary.fake,
      color: '#e53935',
      legendFontColor: '#333',
      legendFontSize: 14,
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Total Calls</Title>
          <Paragraph style={styles.stat}>{summary.total}</Paragraph>
        </Card.Content>
      </Card>

      <View style={styles.row}>
        <Card style={[styles.card, styles.real]}>
          <Card.Content>
            <Title>Real</Title>
            <Paragraph style={styles.stat}>{summary.real}</Paragraph>
          </Card.Content>
        </Card>
        <Card style={[styles.card, styles.fake]}>
          <Card.Content>
            <Title>Fake</Title>
            <Paragraph style={styles.stat}>{summary.fake}</Paragraph>
          </Card.Content>
        </Card>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Real vs Fake</Title>
          <PieChart
            data={chartData}
            width={screenWidth - 48}
            height={180}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              color: () => '#000',
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Top Callers</Title>
          {summary.topCallers.length === 0 ? (
            <Paragraph style={styles.noCalls}>No calls found</Paragraph>
          ) : (
            summary.topCallers.map((caller, index) => (
              <View style={styles.callerItem} key={index}>
                <Avatar.Text
                  size={36}
                  label={caller.from[0]?.toUpperCase() || '?'}
                  style={{ backgroundColor: '#6200ee', marginRight: 12 }}
                />
                <View>
                  <Text style={styles.callerName}>{caller.from}</Text>
                  <View style={styles.callsRow}>
                    <Icon name="phone" size={16} color="#4CAF50" />
                    <Text style={styles.callCount}> {caller.count} calls</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

export default CallInsightsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: '#fff',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  real: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#E8F5E9',
  },
  fake: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: '#FFEBEE',
  },
  stat: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 6,
  },
  callerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  callerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  callsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  callCount: {
    fontSize: 14,
    color: '#555',
  },
  noCalls: {
    marginTop: 8,
    color: '#999',
  },
});
