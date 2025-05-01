import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import workoutService from "../services/WorkoutService";
import { useAuth } from "../context/AuthContext";
import apiService from "../services/ApiService";
import { getFullMediaUrl } from "../config/config";

const WorkoutDetailsScreen = () => {
  const [workout, setWorkout] = useState(null);
  const [exerciseDetails, setExerciseDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const { workoutId, workoutTitle } = route.params;
  const { signOut } = useAuth();

  useEffect(() => {
    fetchWorkoutDetails();
    navigation.setOptions({
      title: workoutTitle || "Szczegóły treningu",
    });
  }, [workoutId, navigation, workoutTitle]);

  const fetchWorkoutDetails = async () => {
    try {
      setLoading(true);
      console.log("[WorkoutDetailsScreen] Fetching workout details...");
      const data = await apiService.get(`/workout/${workoutId}/`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      console.log("[WorkoutDetailsScreen] Workout details:", data);
      setWorkout(data);

      if (data && data.exercises && data.exercises.length > 0) {
        console.log("[WorkoutDetailsScreen] Fetching exercises details...");
        fetchExercisesDetails(data.exercises);
      }
    } catch (error) {
      console.error("[WorkoutDetailsScreen] Error fetching workout details:", error);
      if (error.response) {
        console.error("[WorkoutDetailsScreen] Response status:", error.response.status);
        console.error("[WorkoutDetailsScreen] Response data:", error.response.data);
      }
      if (Platform.OS === 'ios') {
        console.error("[WorkoutDetailsScreen] iOS specific error details:", {
          message: error.message,
          code: error.code,
          response: error.response
        });
      }

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
      } else {
        Alert.alert(
          "Błąd",
          "Nie udało się pobrać szczegółów treningu. Spróbuj ponownie później."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchExercisesDetails = async (exercises) => {
    try {
      setLoadingExercises(true);
      const detailsMap = {};

      // Pobieranie szczegółów dla każdego ćwiczenia
      for (const exercise of exercises) {
        if (exercise.workoutexercise_id) {
          const details = await workoutService.getWorkoutExerciseDetails(
            exercise.workoutexercise_id
          );
          if (details) {
            detailsMap[exercise.workoutexercise_id] = details;
          }
        }
      }

      setExerciseDetails(detailsMap);
    } catch (error) {
      console.error("Error fetching exercise details:", error);
    } finally {
      setLoadingExercises(false);
    }
  };

  const startWorkout = () => {
    if (workout && workout.exercises.length > 0) {
      navigation.navigate("WorkoutExercise", {
        workoutId: workout.id,
        exerciseIndex: 0,
        exercises: workout.exercises,
        workoutTitle: workout.title,
      });
    } else {
      Alert.alert("Informacja", "Ten trening nie zawiera żadnych ćwiczeń.");
    }
  };

  const renderExerciseItem = ({ item, index }) => {
    const detail = exerciseDetails[item.workoutexercise_id];

    return (
      <TouchableOpacity
        style={styles.exerciseItem}
        onPress={() => {
          navigation.navigate("ExerciseDetails", {
            exerciseId: item.exercise_id,
          });
        }}
      >
        <Image
          source={{
            uri: item.image
              ? getFullMediaUrl(item.image)
              : "https://via.placeholder.com/150",
          }}
          style={styles.exerciseImage}
        />
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseTitle}>{item.title}</Text>
          <View style={styles.exerciseStats}>
            {detail ? (
              <>
                <View style={styles.statItem}>
                  <Ionicons name="repeat-outline" size={16} color="#666" />
                  <Text style={styles.statText}>
                    Serie: {detail.main_series || 0}
                    {detail.warmup_series ? `+${detail.warmup_series}` : ""}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="barbell-outline" size={16} color="#666" />
                  <Text style={styles.statText}>
                    Powt.: {detail.main_series_reps || "-"}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="time-outline" size={16} color="#666" />
                  <Text style={styles.statText}>
                    Przerwa: {detail.rest_min || 0}:
                    {detail.rest_sec < 10 ? "0" : ""}
                    {detail.rest_sec || "00"}
                  </Text>
                </View>
                {detail.tempo && (
                  <View style={styles.statItem}>
                    <Ionicons
                      name="speedometer-outline"
                      size={16}
                      color="#666"
                    />
                    <Text style={styles.statText}>Tempo: {detail.tempo}</Text>
                  </View>
                )}
              </>
            ) : loadingExercises ? (
              <Text style={styles.statText}>Ładowanie szczegółów...</Text>
            ) : (
              <Text style={styles.statText}>
                Kliknij, aby zobaczyć szczegóły
              </Text>
            )}
          </View>
          {detail && detail.main && detail.main.length > 0 && (
            <View style={styles.weightsContainer}>
              <Text style={styles.weightsLabel}>Obciążenie: </Text>
              {detail.main.map((weight, idx) => (
                <Text key={idx} style={styles.weightValue}>
                  {idx > 0 ? ", " : ""}
                  {weight}
                </Text>
              ))}
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
      </View>
    );
  }

  if (!workout) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Nie znaleziono treningu</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{
            uri: workout.image
              ? getFullMediaUrl(workout.image)
              : "https://via.placeholder.com/150",
          }}
          style={styles.headerImage}
        />
        <View style={styles.headerOverlay}>
          <Text style={styles.workoutTitle}>{workout.title}</Text>
          {workout.workout_date && (
            <Text style={styles.workoutDate}>
              Data: {new Date(workout.workout_date).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Ćwiczenia w treningu</Text>

        {workout.exercises.length > 0 ? (
          <FlatList
            data={workout.exercises}
            renderItem={renderExerciseItem}
            keyExtractor={(item) => item.workoutexercise_id.toString()}
            contentContainerStyle={styles.exercisesList}
          />
        ) : (
          <Text style={styles.emptyText}>Brak ćwiczeń w tym treningu</Text>
        )}
      </View>

      <TouchableOpacity style={styles.startButton} onPress={startWorkout}>
        <Text style={styles.startButtonText}>Rozpocznij trening</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  header: {
    position: "relative",
    height: 200,
  },
  headerImage: {
    width: "100%",
    height: "100%",
  },
  headerOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 15,
  },
  workoutTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
  },
  workoutDate: {
    fontSize: 14,
    color: "#ddd",
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  exercisesList: {
    paddingBottom: 80, // Extra space for the button
  },
  exerciseItem: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 8,
    marginBottom: 10,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  exerciseImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  exerciseInfo: {
    flex: 1,
    marginLeft: 12,
  },
  exerciseTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  exerciseStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
    marginBottom: 5,
  },
  statText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 3,
  },
  emptyText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginTop: 30,
  },
  startButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#4a90e2",
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  startButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorText: {
    fontSize: 16,
    color: "#ff6b6b",
    textAlign: "center",
  },
  weightsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    backgroundColor: "#f0f0f0",
    padding: 4,
    borderRadius: 4,
  },
  weightsLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#555",
    marginRight: 5,
  },
  weightValue: {
    fontSize: 12,
    color: "#555",
    fontWeight: "500",
  },
});

export default WorkoutDetailsScreen;
