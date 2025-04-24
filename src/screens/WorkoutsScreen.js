import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import {
  getGeneralWorkouts,
  getPersonalWorkouts,
  getFullMediaUrl,
} from "../services/api";

const WorkoutsScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState("personal");
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWorkouts = async (tab = activeTab) => {
    try {
      setLoading(true);
      let data = [];

      if (tab === "personal") {
        data = await getPersonalWorkouts();
      } else {
        data = await getGeneralWorkouts();
      }

      setWorkouts(data);
    } catch (error) {
      console.error("Error fetching workouts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    fetchWorkouts(tab);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWorkouts();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const renderWorkoutItem = ({ item }) => (
    <TouchableOpacity
      style={styles.workoutCard}
      onPress={() =>
        navigation.navigate("WorkoutDetails", {
          workoutId: item.id,
          workoutTitle: item.title,
        })
      }
    >
      <Image
        source={{
          uri: item.image
            ? getFullMediaUrl(item.image)
            : "https://via.placeholder.com/150",
        }}
        style={styles.workoutImage}
      />
      <View style={styles.workoutInfo}>
        <Text style={styles.workoutTitle}>{item.title}</Text>
        {item.workout_date && (
          <Text style={styles.workoutDate}>
            Data: {new Date(item.workout_date).toLocaleDateString()}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "personal" && styles.activeTabButton,
          ]}
          onPress={() => handleTabChange("personal")}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === "personal" && styles.activeTabButtonText,
            ]}
          >
            Treningi osobiste
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "general" && styles.activeTabButton,
          ]}
          onPress={() => handleTabChange("general")}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === "general" && styles.activeTabButtonText,
            ]}
          >
            Treningi ogólne
          </Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#4a90e2" />
        </View>
      ) : workouts.length > 0 ? (
        <FlatList
          data={workouts}
          renderItem={renderWorkoutItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Brak dostępnych treningów w tej kategorii
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 15,
    alignItems: "center",
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: "#4a90e2",
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#888",
  },
  activeTabButtonText: {
    color: "#4a90e2",
    fontWeight: "bold",
  },
  listContainer: {
    padding: 15,
  },
  workoutCard: {
    backgroundColor: "white",
    borderRadius: 10,
    marginBottom: 15,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  workoutImage: {
    width: "100%",
    height: 150,
    backgroundColor: "#ddd",
  },
  workoutInfo: {
    padding: 15,
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  workoutDate: {
    fontSize: 14,
    color: "#666",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
  },
});

export default WorkoutsScreen;
