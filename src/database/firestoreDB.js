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


export const insertAudioFile = async (audioFile, userId) => {
  try {
    const db = getFirestore(getApp());

    const docRef = await addDoc(collection(db, 'audio_files'), {
      userId: audioFile.to,
      from: audioFile.from,
      recordingUrl: audioFile.recordingUrl,
      timestamp: audioFile.timestamp || new Date(), 
      prediction: audioFile.prediction// fallback if not provided
    });

    console.log('Audio file inserted with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error inserting audio file:', error?.message || error);
    throw error;
  }
};

export const fetchAudioFilesFromDB = async (userId) => {
  try {
    console.log('Fetching audio files for user:', userId);
    const db = getFirestore(getApp());
      const audioQuery = query(
        collection(db, 'audio_files'),
        where('userId', '==', userId),
      );

      const snapshot = await getDocs(audioQuery);

      console.log('Fetched docs:', snapshot.size);

      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

    return list;
  } catch (error) {
    console.error('Error fetching audio files:', error?.message || error);
    throw error;
  }
};