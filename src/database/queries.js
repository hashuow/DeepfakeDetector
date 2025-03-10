import {getDatabase} from "./database";

// Insert a new user into the database
export const insertUser = async (user) => {
  console.log(user);
  const database = await getDatabase(); // Ensure database is initialized
console.log("dataabase instance, ", database)
  return new Promise((resolve, reject) => {
    database.transaction((tx) => {
      tx.executeSql(
        `INSERT INTO users (firstName, lastName, username, email, password, phone, createdDateTime, isActive) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          user.firstName,
          user.lastName,
          user.username,
          user.email,
          user.password,
          user.phone,
          user.createdDateTime,
          user.isActive,
        ],
        (_, result) => resolve(result),
        (_, error) => {
          reject(new Error(error.message || "Unknown database error"));
          return true; // tells SQLite to stop further execution
        }
      );
    });
  });
};

// Retrieve all users
export const getUsers = async () => {
  const database = await getDatabase(); // Ensure database is initialized

  return new Promise((resolve, reject) => {
    database.transaction((tx) => {
      tx.executeSql(
        `SELECT * FROM users;`,
        [],
        (_, results) => {
          let users = [];
          for (let i = 0; i < results.rows.length; i++) {
            users.push(results.rows.item(i));
          }
          resolve(users);
        },
        (_, error) => reject(error)
      );
    });
  });
};


export const loginUser = async(username, password) => {
  const database = await getDatabase(); // Ensure database is initialized

  return new Promise((resolve, reject) => {
    database.transaction((tx) => {
      tx.executeSql(
        `SELECT * FROM users`, // Correct SQL query
        [], // Pass parameters as an array
        (_, results) => {
          if (results.rows.length > 0) {
            resolve(results.rows.item(0)); // Return the first user found
          } else {
            reject("Invalid username or password.");
          }
        },
        (_, error) => reject(error)
      );
    });
  });
};
