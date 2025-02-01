import SQLite from 'react-native-sqlite-storage';
import RNFS from 'react-native-fs';

// Open/Create the database
//Create database
const db = SQLite.openDatabase(
    {
      name: 'deepfakeDetector', // Database name
      location: 'default', // Use 'default' or 'Library'

    },
    () => {
      console.log('Database opened successfully');
    },
    (error) => {
      console.error('Error opening database:', error);
    }
  );


  
// Create a function to initialize the database
export const initializeDatabase = () => {
  db.transaction((tx) => {
    // Create the users table if it doesn't exist
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        middleName TEXT NULL,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email TEXT NOT NULL,
        phone INTEGER NOT NULL
      )`,
      [],
      () => console.log('Users table created successfully'),
      (error) => console.error('Error creating users table:', error)
    );
  });
};
export const copyDatabase = async () => {
  const sourcePath = `/data/data/com.deepfakedetector/databases/deepfakeDetector`;
  const destPath = `${RNFS.DownloadDirectoryPath}/deepfakeDetector.db`;

  try {
    await RNFS.copyFile(sourcePath, destPath);
    console.log('Database copied to:', destPath);
  } catch (error) {
    console.error('Failed to copy database:', error);
  }
};
export const getDatabase = () => db;



