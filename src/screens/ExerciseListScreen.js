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
  Alert,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import exerciseService from "../services/ExerciseService";

const ExerciseListScreen = ({ navigation, route }) => {
  const { tagId, tagName } = route.params;
  const { signOut } = useAuth();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await exerciseService.getExercises(tagId);
      setExercises(data);
    } catch (error) {
      console.error("Error fetching exercises:", error);
      setError("Nie udało się załadować ćwiczeń. Spróbuj ponownie.");

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

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchExercises();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchExercises();

    // Ustaw tytuł ekranu na nazwę tagu
    navigation.setOptions({
      title: tagName ? `Ćwiczenia: ${tagName}` : "Ćwiczenia",
    });
  }, [tagId, tagName, navigation]);

  const renderExerciseItem = ({ item }) => (
    <TouchableOpacity
      style={styles.exerciseCard}
      onPress={() =>
        navigation.navigate("ExerciseDetails", { exerciseId: item.id })
      }
    >
      <Image
        source={{
          uri: item.image
            ? exerciseService.getFullImageUrl(item.image)
            : "https://via.placeholder.com/150",
        }}
        style={styles.exerciseImage}
      />
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseTitle}>{item.title}</Text>
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
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchExercises()}
          >
            <Text style={styles.retryButtonText}>Spróbuj ponownie</Text>
          </TouchableOpacity>
        </View>
      ) : exercises.length > 0 ? (
        <FlatList
          data={exercises}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderExerciseItem}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Brak dostępnych ćwiczeń w tej kategorii
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  listContainer: {
    padding: 10,
  },
  exerciseCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 10,
    margin: 5,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxWidth: "48%",
  },
  exerciseImage: {
    width: "100%",
    height: 150,
    backgroundColor: "#ddd",
  },
  exerciseInfo: {
    padding: 12,
  },
  exerciseTitle: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#4a90e2",
    padding: 15,
    borderRadius: 5,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
});

export default ExerciseListScreen;
