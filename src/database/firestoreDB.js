import { getFirestore, collection, addDoc, query, where, getDocs} from '@react-native-firebase/firestore';
import { getApp } from '@react-native-firebase/app';

export const insertUser = async (user) => {
  try {
    const db = getFirestore(getApp());

    const docRef = await addDoc(collection(db, "users"), {
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      password: user.password, 
      phone: user.phone,
      createdAt: new Date(), 
    });

    console.log("User registered with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error inserting user:", error);
    throw error;
  }
};

export const loginUser = async (username) => {
  try {
    const db = getFirestore(getApp());
    
    const userQuery = query(
      collection(db, "users"),
      where("username", "==", username)
    );

    const querySnapshot = await getDocs(userQuery);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return { id: userDoc.id, ...userDoc.data() };
    } else {
      throw new Error("Invalid username or password");
    }
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

export const fetchAudioFiles = async () => {
  try {
    const db = getFirestore(getApp());
    const audioQuery = collection(db, 'voice_recordings');
    const snapshot = await getDocs(audioQuery);

    const list = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        from: data.from,
        recordingUrl: data.recordingUrl,
        timestamp: data.timestamp,
      };
    });

    return list;
  } catch (error) {
    console.error('Error fetching audio files:', error.message);
    throw error;
  }
}
export const insertAudioFile = async (audioFile) => {
  try {
    const db = getFirestore(getApp());

    const docRef = await addDoc(collection(db, "voice_recordings"), {
      from: audioFile.from,
      recordingUrl: audioFile.recordingUrl,
      timestamp: audioFile.timestamp,
    });

    console.log("Audio file inserted with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error inserting audio file:", error);
    throw error;
  }
};

