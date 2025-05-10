import React, { useEffect, useRef, useState } from "react";
import { Alert, AppState } from "react-native";
import messaging from "@react-native-firebase/messaging";
import AppNavigator from "./src/navigation/AppNavigator";
import Sound from "react-native-sound";
import RNFS from "react-native-fs";
import StreamPlayer from "./src/screens/Home/StreamPlayer";

const WS_URL = 'wss://c159-2001-4479-1801-a300-949-7d3a-25f6-65dd.ngrok-free.app';

const App = () => {
  const ws = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const currentAudio = useRef<Sound | null>(null);
  const alarmSound = useRef<Sound | null>(null);
  const fcmUnsubscribe = useRef<(() => void) | undefined>(undefined);

  // Stream state
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [caller, setCaller] = useState<string>(''); // For "from" number/name
  const [to, setTo] = useState<string>(''); // For "to" number/name


  useEffect(() => {
    Sound.setCategory("Playback");

    // Load alarm sound
    alarmSound.current = new Sound("alarm", Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.error("Failed to load alarm sound", error);
      } else {
        console.log("✅ Alarm sound loaded");
      }
    });

    // FCM Setup
    setupFCM();

    // WebSocket setup
    connectWebSocket();

    const appStateListener = AppState.addEventListener("change", (state) => {
      if (state === "active" && !connected) connectWebSocket();
    });

    return () => {
      ws.current?.close();
      fcmUnsubscribe.current?.();
      currentAudio.current?.release();
      appStateListener.remove();
    };
  }, []);

  const setupFCM = async () => {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        const token = await messaging().getToken();
        console.log("FCM Token:", token);

        fcmUnsubscribe.current = messaging().onMessage(async (remoteMessage) => {
          console.log("🔥 FCM Message:", remoteMessage);

          if (remoteMessage.notification?.title === "Fake Voice Detected!") {
            alarmSound.current?.play((success) => {
              if (!success) console.error("🔇 Alarm playback failed");
            });
          }

          Alert.alert(
            remoteMessage.notification?.title || "Alert",
            remoteMessage.notification?.body || "You have a new message."
          );
        });
      } else {
        console.log("❌ Notification permission denied.");
      }
    } catch (error) {
      console.error("⚠️ FCM setup error:", error);
    }
  };

  const connectWebSocket = () => {
    ws.current = new WebSocket(WS_URL);

    ws.current.onopen = () => {
      console.log("✅ WebSocket connected");
      setConnected(true);
      ws.current?.send(JSON.stringify({ type: "client" }));
    };

    ws.current.onmessage = async (event) => {
      const message = JSON.parse(event.data);

      if (message.type === "incoming_call") {
        console.log("📞 Incoming Call:", message.from);
        Alert.alert("📞 Incoming Call", `From: ${message.from}`);
      }

      if (message.type === "audio") {
        console.log("🎧 Audio received");
        await playBase64Audio(message.payload);
      }

      if (message.type === "recording") {
        console.log("🎙️ Received recording URL:", message.url);
        setRecordingUrl(message.url);
        setCaller(message.from || 'Unknown'); // Show caller name/number
        setTo(message.to || 'Unknown'); // Show recipient name/number
      }

      if (message.type === "end_stream") {
        stopAudioPlayback();
      }
    };

    ws.current.onerror = (e) => {
      console.error("❌ WebSocket error:", e.message);
    };

    ws.current.onclose = () => {
      console.warn("🔌 WebSocket disconnected");
      setConnected(false);
      setTimeout(connectWebSocket, 3000);
    };
  };

  const playBase64Audio = async (base64: string) => {
    try {
      const path = `${RNFS.DocumentDirectoryPath}/audio_${Date.now()}.mp3`;
      await RNFS.writeFile(path, base64, "base64");

      const sound = new Sound(path, "", (error) => {
        if (error) {
          console.error("Error loading audio", error);
          return;
        }
        sound.play((success) => {
          if (!success) console.error("Error playing audio");
          sound.release();
        });
        currentAudio.current = sound;
      });
    } catch (error) {
      console.error("Error playing base64 audio:", error);
    }
  };

  const stopAudioPlayback = () => {
    if (currentAudio.current) {
      currentAudio.current.stop(() => {
        currentAudio.current?.release();
        currentAudio.current = null;
      });
    }
  };

  return (
    <>
      <AppNavigator />

      {/* Full-screen incoming call UI when recordingUrl is received */}
      {recordingUrl && (
        <StreamPlayer
          recordingUrl={recordingUrl}
          from={caller}
          to={to}
          onEnd={() => {
            setRecordingUrl(null);
            setCaller('');
          }}
        />
      )}
    </>
  );
};

export default App;
