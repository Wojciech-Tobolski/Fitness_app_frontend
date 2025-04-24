import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import WorkoutItem from "../components/WorkoutItem";
import CategoryList from "../components/CategoryList";
import workoutService from "../services/WorkoutService";
import { useAuth } from "../context/AuthContext";

const ExploreScreen = () => {
  const [workouts, setWorkouts] = useState([]);
  const [filteredWorkouts, setFilteredWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const navigation = useNavigation();
  const { signOut } = useAuth();

  useEffect(() => {
    fetchWorkouts();
  }, []);

  useEffect(() => {
    filterWorkouts();
  }, [searchQuery, selectedCategory, workouts]);

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      const data = await workoutService.getWorkouts();
      setWorkouts(data);
      setFilteredWorkouts(data);
    } catch (error) {
      console.error("Error fetching workouts:", error);

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

  const filterWorkouts = () => {
    let filtered = [...workouts];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((workout) =>
        workout.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(
        (workout) => workout.category === selectedCategory
      );
    }

    setFilteredWorkouts(filtered);
  };

  const handleCategoryPress = (category) => {
    setSelectedCategory(category === selectedCategory ? null : category);
  };

  const handleWorkoutPress = (workoutId) => {
    navigation.navigate("WorkoutDetails", { workoutId });
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchWorkouts();
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  const clearSearch = () => {
    setSearchQuery("");
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
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#666"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Szukaj treningów..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={clearSearch}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>

      <CategoryList
        selectedCategory={selectedCategory}
        onCategoryPress={handleCategoryPress}
      />

      {filteredWorkouts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Nie znaleziono treningów dla podanych kryteriów.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredWorkouts}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    padding: 10,
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  loadingContainer: {
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
    color: "#666",
    textAlign: "center",
  },
});

export default ExploreScreen;
