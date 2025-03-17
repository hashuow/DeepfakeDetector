import SQLite from "react-native-sqlite-storage";

SQLite.DEBUG(true);
SQLite.enablePromise(true);

let dbInstance = null;

const getDatabase = () => {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    SQLite.openDatabase(
      { name: "deepfakeDB.db", location: "default" },
      (db) => {
        console.log("Database opened successfully!");
        dbInstance = db;
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
        dbInstance = null;
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