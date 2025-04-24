import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { getTodayWorkouts, getFullMediaUrl } from "../services/api";

const WelcomeScreen = ({ navigation }) => {
  const { userData, signOut } = useAuth();
  const [todayWorkouts, setTodayWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTodayWorkouts = async () => {
    try {
      setLoading(true);
      const workouts = await getTodayWorkouts();
      setTodayWorkouts(workouts);
    } catch (error) {
      console.error("Error fetching today workouts:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTodayWorkouts();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchTodayWorkouts();
  }, []);

  if (!userData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image
            source={{
              uri: userData.image
                ? getFullMediaUrl(userData.image)
                : "https://via.placeholder.com/150",
            }}
            style={styles.userImage}
          />
          <View>
            <Text style={styles.welcomeText}>
              Witaj, {userData.first_name}!
            </Text>
            <Text style={styles.subText}>Cieszymy się, że jesteś z nami</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dzisiejsze treningi</Text>

        {loading ? (
          <ActivityIndicator
            size="small"
            color="#4a90e2"
            style={styles.loader}
          />
        ) : todayWorkouts.length > 0 ? (
          todayWorkouts.map((workout) => (
            <TouchableOpacity
              key={workout.id}
              style={styles.workoutCard}
              onPress={() => navigation.navigate("Workouts")}
            >
              <Image
                source={{
                  uri: workout.image
                    ? getFullMediaUrl(workout.image)
                    : "https://via.placeholder.com/150",
                }}
                style={styles.workoutImage}
              />
              <View style={styles.workoutInfo}>
                <Text style={styles.workoutTitle}>{workout.title}</Text>
                <Text style={styles.workoutDate}>
                  {workout.workout_date
                    ? new Date(workout.workout_date).toLocaleDateString()
                    : "Bez daty"}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Brak treningów na dzisiaj</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
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
          <Text style={styles.emptyStateText}>
            Nie masz przypisanego trenera
          </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 20,
    backgroundColor: "#4a90e2",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  userImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    backgroundColor: "#ddd",
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  subText: {
    fontSize: 14,
    color: "#e0e0e0",
    marginTop: 5,
  },
  section: {
    padding: 20,
    backgroundColor: "#fff",
    marginBottom: 15,
    borderRadius: 8,
    margin: 10,
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
  loader: {
    marginVertical: 20,
  },
  workoutCard: {
    flexDirection: "row",
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 10,
  },
  workoutImage: {
    width: 80,
    height: 80,
    backgroundColor: "#ddd",
  },
  workoutInfo: {
    padding: 10,
    justifyContent: "center",
    flex: 1,
  },
  workoutTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
  },
  workoutDate: {
    fontSize: 14,
    color: "#666",
  },
  emptyState: {
    alignItems: "center",
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
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

export default WelcomeScreen;
