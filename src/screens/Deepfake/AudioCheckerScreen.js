import React, { useState } from "react";
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


Sound.setCategory("Playback");

// Preload sound files from res/raw folder using require
// const audioFiles = {
//   "voice1.mp3": require("../../../android/app/src/main/res/raw/voice1.mp3"),
//   "df1.mp3": require("../../../android/app/src/main/res/raw/df1.mp3"),
//   "df2.mp3": require("../../../android/app/src/main/res/raw/df2.mp3"),
//   "hashvoice1.mp3": require("../../../android/app/src/main/res/raw/hashvoice1.mp3"),
//   "alarm.mp3": require("../../../android/app/src/main/res/raw/alarm.mp3"),
// };
// const audioFiles = {
// //   "voice1.mp3": require("../../../android/app/src/main/res/raw/voice1.mp3"),
// //   "df1.mp3": require("../../../android/app/src/main/res/raw/df1.mp3"),
// //   "df2.mp3": require("../../../android/app/src/main/res/raw/df2.mp3"),
// //   "hashvoice1.mp3": require("../../../android/app/src/main/res/raw/hashvoice1.mp3"),
//   "alarm.mp3": require("../../../android/app/src/main/res/raw/alarm.mp3"),
// };

const audioFiles = ["voice1.mp3", "df1.mp3", "df2.mp3", "realvoice1.flac"];


const AudioCheckerScreen = () => {
  const [selectedAudio, setSelectedAudio] = useState("voice1.mp3");
  const [isCalling, setIsCalling] = useState(false);
  const [loading, setLoading] = useState(false);

  const playAudio = () => {
    const sound = new Sound('alarm', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.error("Failed to load sound", error);
        Alert.alert("Error", "Failed to load sound: " + error.message);
        return;
      }
  
      sound.play((success) => {
        if (!success) {
          console.error("Failed to play sound");
        }
        sound.release();
      });
    });
  };
  

  const simulateCall = async () => {
    setIsCalling(true);
    setLoading(true);

    try {

      console.log(selectedAudio)

      const filePath = `${RNFS.DocumentDirectoryPath}/${selectedAudio}`;

    // Step 2: Copy from raw assets if not already copied
    const exists = await RNFS.exists(filePath);
    console.log("exists----",exists)
    if (!exists) {
      console.log("copying file --",exists)
      await RNFS.copyFileAssets(selectedAudio, filePath);
      console.log("Copied to:", filePath);
    }

    // Step 3: Prepare the file upload
    const formData = new FormData();
    formData.append("audio", {
      uri: "file://" + filePath,
      type: "audio/mpeg",
      name: selectedAudio,
    });

    // Step 4: Make the HTTP POST request
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
        playAudio("alarm.mp3");
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
      <Text style={styles.title}>📞 Incoming Call Simulation</Text>

      <Picker
        selectedValue={selectedAudio}
        onValueChange={(itemValue) => setSelectedAudio(itemValue)}
        style={styles.picker}
      >
        {audioFiles.map((file) => (
            <Picker.Item key={file} label={file} value={file} />
          ))}
      </Picker>

      <Button title="Simulate Incoming Call" onPress={simulateCall} />

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#0000ff"
          style={{ marginTop: 20 }}
        />
      ) : null}

      {isCalling ? (
        <View style={styles.callScreen}>
          <Text style={styles.callText}>📲 Incoming Call...</Text>
        </View>
      ) : null}
    </View>
  );
};

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

export default AudioCheckerScreen;
