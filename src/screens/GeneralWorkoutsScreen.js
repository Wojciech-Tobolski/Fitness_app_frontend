import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import workoutService from "../services/WorkoutService";
import { useAuth } from "../context/AuthContext";

const GeneralWorkoutsScreen = () => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const { signOut } = useAuth();

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      const data = await workoutService.getGeneralWorkouts();
      setWorkouts(data);
    } catch (error) {
      console.error("Error fetching workouts:", error);

      // Jeśli błąd 401, to prawdopodobnie token wygasł
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
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWorkouts();
    setRefreshing(false);
  };

  const handleWorkoutPress = (workout) => {
    navigation.navigate("WorkoutDetails", { workoutId: workout.id });
  };

  const renderWorkoutItem = ({ item }) => (
    <TouchableOpacity
      style={styles.workoutItem}
      onPress={() => handleWorkoutPress(item)}
    >
      <Image
        source={{
          uri: item.image
            ? workoutService.getFullImageUrl(item.image)
            : "https://via.placeholder.com/350",
        }}
        style={styles.workoutImage}
      />
      <View style={styles.workoutDetails}>
        <Text style={styles.workoutTitle}>{item.title}</Text>
        <Text style={styles.workoutDescription}>{item.description}</Text>
        <View style={styles.workoutMeta}>
          <Text style={styles.workoutMetaText}>Poziom: {item.difficulty}</Text>
          <Text style={styles.workoutMetaText}>Czas: {item.duration} min</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={workouts}
        renderItem={renderWorkoutItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Brak dostępnych treningów</Text>
          </View>
        }
      />
    </View>
  );
};

// ... style pozostają bez zmian
