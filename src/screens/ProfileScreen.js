import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { getFullMediaUrl } from "../services/api";

const ProfileScreen = () => {
  const { userData, signOut } = useAuth();

  if (!userData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Nie udało się załadować danych użytkownika
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{
            uri: userData.image
              ? getFullMediaUrl(userData.image)
              : "https://via.placeholder.com/150",
          }}
          style={styles.profileImage}
        />
        <Text style={styles.name}>
          {userData.first_name} {userData.last_name}
        </Text>
        <Text style={styles.email}>{userData.email}</Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Informacje o koncie</Text>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Nazwa użytkownika</Text>
          <Text style={styles.infoValue}>{userData.username}</Text>
        </View>

        {userData.active_until && (
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Konto aktywne do</Text>
            <Text style={styles.infoValue}>
              {new Date(userData.active_until).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Twój trener</Text>
        {userData.trainer ? (
          <View style={styles.trainerCard}>
            <Image
              source={{
                uri: userData.trainer.image
                  ? getFullMediaUrl(userData.trainer.image)
                  : "https://via.placeholder.com/150",
              }}
              style={styles.trainerImage}
            />
            <View style={styles.trainerInfo}>
              <Text style={styles.trainerName}>
                {userData.trainer.first_name} {userData.trainer.last_name}
              </Text>
              <Text style={styles.trainerTitle}>Twój osobisty trener</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.noDataText}>Nie masz przypisanego trenera</Text>
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
        <Text style={styles.logoutButtonText}>Wyloguj się</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#4a90e2",
    padding: 30,
    alignItems: "center",
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
    borderWidth: 4,
    borderColor: "white",
    backgroundColor: "#ddd",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  infoSection: {
    backgroundColor: "white",
    margin: 15,
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontSize: 16,
    color: "#555",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  trainerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 15,
  },
  trainerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    backgroundColor: "#ddd",
  },
  trainerInfo: {
    flex: 1,
  },
  trainerName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
  },
  trainerTitle: {
    fontSize: 14,
    color: "#666",
  },
  noDataText: {
    fontSize: 16,
    color: "#888",
    fontStyle: "italic",
    textAlign: "center",
    padding: 15,
  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
    padding: 20,
  },
  logoutButton: {
    margin: 20,
    padding: 15,
    backgroundColor: "#e74c3c",
    borderRadius: 8,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default ProfileScreen;
