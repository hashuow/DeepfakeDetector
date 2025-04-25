import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Button,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import Sound from "react-native-sound";
import RNFS from "react-native-fs";
import { getAllAudioFiles } from "../../database/queries"; // Adjust path if needed

Sound.setCategory("Playback");

const IncomingCallSimulator = () => {
  const [audioFiles, setAudioFiles] = useState([]);
  const [selectedAudio, setSelectedAudio] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAudioFiles = async () => {
      try {
        const files = await getAllAudioFiles();
        setAudioFiles(files);
        if (files.length > 0) {
          setSelectedAudio(files[0].filename);
        }
      } catch (error) {
        console.error("Failed to load audio files:", error);
        Alert.alert("Error", "Failed to fetch audio files from database.");
      }
    };

    fetchAudioFiles();
  }, []);

  const playAudio = () => {
    const sound = new Sound("alarm.mp3", Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.error("Failed to load alarm sound:", error);
        Alert.alert("Error", "Alarm sound could not be loaded.");
        return;
      }

      sound.play((success) => {
        if (!success) {
          console.error("Failed to play alarm sound");
        }
        sound.release();
      });
    });
  };

  const simulateCall = async () => {
    if (!selectedAudio) return;

    setIsCalling(true);
    setLoading(true);

    try {
      const filePath = `${RNFS.DocumentDirectoryPath}/${selectedAudio}`;
      const exists = await RNFS.exists(filePath);

      if (!exists) {
        Alert.alert("Error", `File not found: ${selectedAudio}`);
        setIsCalling(false);
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("audio", {
        uri: "file://" + filePath,
        type: "audio/mpeg",
        name: selectedAudio,
      });

      const response = await fetch("http://10.0.2.2:8000/predict/", {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
          Accept: "application/json",
        },
        body: formData,
      });

      const data = await response.json();
      console.log("Server response:", data);

      setLoading(false);

      if (data.real === true) {
        Alert.alert("Result", "✅ Real call detected.");
      } else {
        Alert.alert("Result", "🚨 Fake call detected. Playing alarm...");
        playAudio();
      }
    } catch (error) {
      setLoading(false);
      Alert.alert("Error", "Failed to reach server: " + error.message);
    } finally {
      setIsCalling(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📞 Incoming Call Simulator</Text>

      {audioFiles.length === 0 ? (
        <Text>No audio files found.</Text>
      ) : (
        <Picker
          selectedValue={selectedAudio}
          onValueChange={(itemValue) => setSelectedAudio(itemValue)}
          style={styles.picker}
        >
          {audioFiles.map((file) => (
            <Picker.Item key={file.id} label={file.filename} value={file.filename} />
          ))}
        </Picker>
      )}

      <Button title="Simulate Incoming Call" onPress={simulateCall} disabled={!selectedAudio} />

      {loading && <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} />}

      {isCalling && (
        <View style={styles.callScreen}>
          <Text style={styles.callText}>📲 Incoming Call...</Text>
        </View>
      )}
    </View>
  );
};

export default IncomingCallSimulator;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  picker: {
    marginVertical: 20,
  },
  callScreen: {
    marginTop: 40,
    padding: 30,
    backgroundColor: "#222",
    borderRadius: 10,
    alignItems: "center",
  },
  callText: {
    color: "#fff",
    fontSize: 20,
  },
});
