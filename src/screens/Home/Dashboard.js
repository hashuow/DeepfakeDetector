import React, { useState } from "react";
import { View, Text, Button, StyleSheet, Alert } from "react-native";
import { Table, Row, Rows } from "react-native-table-component";

const DashboardScreen = ({ navigation }) => {
  // Table header and empty data array
  const tableHead = ["Name", "Call Status", "Created At", "Status"];
  const [tableData, setTableData] = useState([]); // Initially empty data

  // Logout function
  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: () => {
          console.log("Logging out...");
          navigation.reset({
            index: 0,
            routes: [{ name: "Login" }],
          });
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <View style={styles.tableContainer}>
        <Table borderStyle={{ borderWidth: 1, borderColor: "#C1C0B9" }}>
          <Row data={tableHead} style={styles.head} textStyle={styles.text} />
          <Rows data={tableData} textStyle={styles.text} />
        </Table>
      </View>
      <Button title="Logout" onPress={handleLogout} color="#FF3B30" />
    </View>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  tableContainer: {
    marginBottom: 20,
    width: "90%",
    paddingHorizontal: 10,
  },
  head: {
    height: 50,
    backgroundColor: "#f1f8ff",
  },
  text: {
    margin: 6,
    textAlign: "center",
  },
});
