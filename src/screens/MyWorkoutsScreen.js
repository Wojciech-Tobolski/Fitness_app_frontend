import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import WorkoutItem from "../components/WorkoutItem";
import workoutService from "../services/WorkoutService";
import { useAuth } from "../context/AuthContext";

const MyWorkoutsScreen = () => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const { signOut } = useAuth();

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      const data = await workoutService.getUserWorkouts();
      setWorkouts(data);
    } catch (error) {
      console.error("Error fetching user workouts:", error);

      // Handle authentication error
      if (error.response && error.response.status === 401) {
        Alert.alert(
          "Błąd uwierzytelniania",
          "Twoja sesja wygasła. Zaloguj się ponownie.",
          [
            {
              text: "OK",
              onPress: () => signOut(),
            },
          ]
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchWorkouts();
  };

  const handleWorkoutPress = (workoutId) => {
    navigation.navigate("WorkoutDetails", { workoutId });
  };

  const handleCreateWorkout = () => {
    navigation.navigate("CreateWorkout");
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.createButton}
        onPress={handleCreateWorkout}
      >
        <Text style={styles.createButtonText}>Stwórz własny trening</Text>
      </TouchableOpacity>

      {workouts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Nie masz jeszcze żadnych własnych treningów.
          </Text>
          <Text style={styles.emptySubtext}>
            Kliknij przycisk powyżej, aby stworzyć swój pierwszy trening!
          </Text>
        </View>
      ) : (
        <FlatList
          data={workouts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <WorkoutItem
              workout={item}
              onPress={() => handleWorkoutPress(item.id)}
            />
          )}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
};

// ... style pozostają bez zmian
