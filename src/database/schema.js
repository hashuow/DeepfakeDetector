import {getDatabase,deleteDatabase} from "./database"; // Import correctly

export const createTables = async () => {

  // await deleteDatabase();
  const database = await getDatabase(); // Wait for database initialization

  console.log("Checking Database Instance:", database); // Debug log

  if (!database) {
    console.error(" Database is not initialized!");
    return;
  }

  database.transaction((tx) => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        username TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone TEXT UNIQUE NOT NULL,
        createdDateTime DATETIME DEFAULT CURRENT_TIMESTAMP,
        isActive INTEGER NOT NULL DEFAULT 1
      );`,
      [],
      () => console.log(" Users table created successfully!"),
      (error) => console.error("Error creating Users table:", error)
    );
  });
};
