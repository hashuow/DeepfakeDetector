import { use } from "react";
import {getDatabase} from "./database";

// Insert a new user into the database
export const insertUser = async (user) => {
  console.log("🚀 Inserting user:", user);
  const database = await getDatabase();
  console.log("📦 Database instance:", database);

  return new Promise((resolve, reject) => {
    database.transaction((tx) => {
      tx.executeSql(
        `INSERT INTO users (firstName, lastName, username, email, password, phone) 
         VALUES (?, ?, ?, ?, ?, ?);`,
        [
          user.firstName,
          user.lastName,
          user.username,
          user.email,
          user.password,
          user.phone
          
        ],
        (_, result) => {
          if (result.rowsAffected > 0) {
            console.log("✅ Insert successful, Insert ID:", result.insertId);
            resolve(result);
          } else {
            reject(new Error("⚠️ Insert failed. No rows affected."));
          }
        },
        (_, error) => {
          console.error("❌ Insert error:", error);
          reject(new Error(error.message || "Unknown database error"));
          return true; // Stop further execution
        }
      );
    });
  });
};


export const loginUser = async (username, password) => {

  await getUsers();
  const database = await getDatabase();

  return new Promise((resolve, reject) => {
    database.transaction((tx) => {
      tx.executeSql(
        `SELECT * FROM users where username = ? and password = ?`,
        [username.trim(), password.trim()],
        (_, results) => {
          const users = [];
          for (let i = 0; i < results.rows.length; i++) {
            users.push(results.rows.item(i));
          }
          if(users.length > 0) {
            resolve(users[0]);
          } else {
            resolve(null);
          }
          
        },
        (_, error) => {
          console.error("❌ SQL error during login:", error);
          reject(error);
        }
      );
    });
  });
};

export const getUsers = async () => {
  const database = await getDatabase();

  return new Promise((resolve, reject) => {
    database.transaction((tx) => {
      tx.executeSql(
        `SELECT * FROM users;`,
        [],
        (_, results) => {
          const users = [];
          for (let i = 0; i < results.rows.length; i++) {
            users.push(results.rows.item(i));
          }
          console.log("📋 All users:", users);
          resolve(users);
        },
        (_, error) => {
          console.error("❌ Error fetching users:", error);
          reject(error);
        }
      );
    });
  });
};

export const insertAudioFile = async (filename, filepath) => {
  const db = await getDatabase();

  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `INSERT INTO audio_files (filename, filepath) VALUES (?, ?);`,
        [filename, filepath],
        (_, result) => {
          console.log("✅ Audio inserted with ID:", result.insertId);
          resolve(result.insertId);
        },
        (_, error) => {
          console.error("❌ Insert audio failed:", error);
          reject(error);
        }
      );
    });
  });
};
export const getAllAudioFiles = async () => {
  const db = await getDatabase();

  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT * FROM audio_files ORDER BY insertTime DESC;`,
        [],
        (_, results) => {
          const audioFiles = [];
          for (let i = 0; i < results.rows.length; i++) {
            audioFiles.push(results.rows.item(i));
          }
          resolve(audioFiles);
        },
        (_, error) => {
          console.error("❌ Fetch audio files failed:", error);
          reject(error);
        }
      );
    });
  });
};
