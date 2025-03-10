import React, { useEffect } from "react";
import AppNavigator from "./src/navigation/AppNavigator";
import { createTables } from "./src/database/schema";

const App = () => {
  useEffect(() => {
    const initializeDB = async () => {
      await createTables(); // Wait for database setup
    };
    initializeDB();
  }, []);

  return <AppNavigator />;
};

export default App;
