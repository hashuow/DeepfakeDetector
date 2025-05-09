import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import Video from 'react-native-video';
import Sound from 'react-native-sound';

const { width, height } = Dimensions.get('window');

const StreamPlayer = ({ recordingUrl, from, onEnd }) => {
  const [callAccepted, setCallAccepted] = useState(false);
  const [paused, setPaused] = useState(true);
  const ringtoneRef = useRef(null);

  useEffect(() => {
    Sound.setCategory('Playback');

    // 🔔 Play ringtone on mount
    ringtoneRef.current = new Sound('ringtone', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.error('❌ Failed to load ringtone:', error);
        return;
      }
      ringtoneRef.current.setNumberOfLoops(-1); // loop
      ringtoneRef.current.play((success) => {
        if (!success) console.error('🔇 Ringtone failed');
      });
    });

    return () => stopRingtone();
  }, []);

  const stopRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.stop();
      ringtoneRef.current.release();
      ringtoneRef.current = null;
    }
  };

  const handleAccept = () => {
    stopRingtone();
    setCallAccepted(true);
    setPaused(false);
  };

  const handleReject = () => {
    stopRingtone();
    setPaused(true);
    setCallAccepted(false);
    onEnd(); // close player
  };

  return (
    <View style={styles.fullscreen}>
      <StatusBar hidden={true} />
      {!callAccepted ? (
        <>
          <Text style={styles.incomingText}>📞 Incoming Call</Text>
          <Text style={styles.fromText}>{from || 'Unknown Caller'}</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.rejectButton} onPress={handleReject}>
              <Text style={styles.buttonText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
              <Text style={styles.buttonText}>Accept</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.inCallText}>🔊 In Call</Text>
          <TouchableOpacity style={styles.hangupButton} onPress={handleReject}>
            <Text style={styles.buttonText}>Hang Up</Text>
          </TouchableOpacity>
        </>
      )}

      {callAccepted && (
        <Video
          source={{ uri: recordingUrl }}
          paused={paused}
          audioOnly
          onError={(e) => console.error('Audio error:', e)}
          onEnd={() => {
            setPaused(true);
            onEnd();
          }}
          style={{ height: 0, width: 0 }}
        />
      )}
    </View>
  );
};

export default StreamPlayer;

const styles = StyleSheet.create({
  fullscreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: height,
    width: width,
    backgroundColor: '#0b1623',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  incomingText: {
    fontSize: 24,
    color: '#ccc',
    marginBottom: 10,
  },
  fromText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 30,
  },
  inCallText: {
    fontSize: 28,
    color: 'white',
    marginBottom: 40,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: width * 0.9,
  },
  acceptButton: {
    backgroundColor: '#28a745',
    paddingVertical: 18,
    paddingHorizontal: 28,
    borderRadius: 60,
    marginHorizontal: 10,
  },
  rejectButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 18,
    paddingHorizontal: 28,
    borderRadius: 60,
    marginHorizontal: 10,
  },
  hangupButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 60,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 18,
  },
});
