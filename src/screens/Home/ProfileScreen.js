import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Switch,
  TextInput,
  Image,
  TouchableOpacity,
} from 'react-native';
import {
  Avatar,
  Text,
  Title,
  Button,
  useTheme,
  Divider,
} from 'react-native-paper';
import firestore from '@react-native-firebase/firestore';
import { AuthContext } from '../../navigation/AppNavigator';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';


const ProfileSettingsScreen = () => {
  const { colors } = useTheme();
  const { username } = useContext(AuthContext);
  const [userDocId, setUserDocId] = useState('');
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);

  const [nightMode, setNightMode] = useState(false);
  const [twitterEnabled, setTwitterEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const fetchUser = async () => {
    const snapshot = await firestore()
      .collection('users')
      .where('username', '==', username)
      .get();
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      setUserDocId(doc.id);
      setProfile(doc.data());
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleSave = async () => {
    await firestore().collection('users').doc(userDocId).update({
      ...profile,
    });
    setEditing(false);
  };

  const handleInputChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  if (!profile) return null;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Avatar.Image size={90} source={require('../../../assets/avatar.jpg')} />
        <TouchableOpacity style={styles.cameraIcon}>
          <Icon name="camera" size={24} color="#777" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          value={`${profile.firstName} ${profile.lastName}`}
          editable={false}
          style={styles.input}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          value={profile.email}
          editable={false}
          style={styles.input}
        />

        <Text style={styles.label}>Phone</Text>
        <TextInput
          value={profile.phone}
          editable={editing}
          onChangeText={text => handleInputChange('phone', text)}
          style={styles.input}
        />

        <Text style={styles.label}>Address</Text>
        <TextInput
          placeholder="Enter your address"
          value={profile.address || ''}
          editable={editing}
          onChangeText={text => handleInputChange('address', text)}
          style={styles.input}
        />
      </View>

      <Divider style={{ marginVertical: 16 }} />

      {/* <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Night Mode</Text>
        <Switch value={nightMode} onValueChange={setNightMode} />
      </View>
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Twitter</Text>
        <Switch value={twitterEnabled} onValueChange={setTwitterEnabled} />
      </View>
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Notifications</Text>
        <Switch
          value={notificationsEnabled}
          onValueChange={setNotificationsEnabled}
        />
      </View> */}

      <View style={styles.buttonRow}>
        <Button
          icon={editing ? 'content-save' : 'pencil'}
          mode={editing ? 'contained' : 'outlined'}
          onPress={editing ? handleSave : () => setEditing(true)}
        >
          {editing ? 'Save' : 'Edit'}
        </Button>
      </View>
    </ScrollView>
  );
};

export default ProfileSettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 18,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    backgroundColor: '#eee',
    padding: 6,
    borderRadius: 30,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    padding: 10,
    marginBottom: 16,
    fontSize: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  toggleLabel: {
    fontSize: 16,
  },
  buttonRow: {
    marginTop: 24,
    alignItems: 'center',
  },
});
