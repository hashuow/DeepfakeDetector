import SQLite from "react-native-sqlite-storage";

// Enable debugging (optional)
SQLite.DEBUG(true);
SQLite.enablePromise(true);

// Open database using a promise
const getDatabase = () => {
  return new Promise((resolve, reject) => {
    const db = SQLite.openDatabase(
      { name: "deepfakeDB.db", location: "default" },
      () => {
        console.log("Database opened successfully!");
        resolve(db);
      },
      (error) => {
        console.error("Database Error:", error);
        reject(error);
      }
    );
  });
};
const deleteDatabase = () => {
  return new Promise((resolve, reject) => {
    SQLite.deleteDatabase(
      { name: "deepfakeDB.db", location: "default" },
      () => {
        console.log("Database deleted successfully!");
        resolve();
      },
      (error) => {
        console.error("Failed to delete database:", error);
        reject(error);
      }
    );
  });
};

export { getDatabase, deleteDatabase };
