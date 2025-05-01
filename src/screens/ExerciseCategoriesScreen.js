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

const ExerciseCategoriesScreen = ({ navigation }) => {
  const { signOut } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await exerciseService.getTagCategories();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setError("Nie udało się załadować kategorii. Spróbuj ponownie.");

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
    await fetchCategories();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const renderTagItem = ({ item, categoryName }) => (
    <TouchableOpacity
      style={styles.tagItem}
      onPress={() =>
        navigation.navigate("ExerciseList", {
          tagId: item.id,
          tagName: item.name,
        })
      }
    >
      {item.image ? (
        <Image
          source={{
            uri: exerciseService.getFullImageUrl(item.image),
          }}
          style={styles.tagImage}
          onError={(e) => {
            console.error('[ExerciseCategoriesScreen] Image load error:', e.nativeEvent.error);
          }}
        />
      ) : (
        <View style={[styles.tagImage, styles.placeholderImage]}>
          <Text style={styles.placeholderText}>?</Text>
        </View>
      )}
      <Text style={styles.tagName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderCategoryItem = ({ item }) => (
    <View style={styles.categoryContainer}>
      <Text style={styles.categoryTitle}>{item.name}</Text>
      <FlatList
        horizontal
        data={item.tags || []}
        keyExtractor={(tag) =>
          tag.id ? tag.id.toString() : Math.random().toString()
        }
        renderItem={({ item: tag }) =>
          renderTagItem({ item: tag, categoryName: item.name })
        }
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tagsContainer}
      />
    </View>
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
            onPress={() => fetchCategories()}
          >
            <Text style={styles.retryButtonText}>Spróbuj ponownie</Text>
          </TouchableOpacity>
        </View>
      ) : categories.length > 0 ? (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderCategoryItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Brak dostępnych kategorii ćwiczeń
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
    padding: 15,
  },
  categoryContainer: {
    marginBottom: 20,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  tagsContainer: {
    paddingVertical: 10,
  },
  tagItem: {
    marginRight: 15,
    alignItems: "center",
    width: 100,
  },
  tagImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#ddd",
    marginBottom: 8,
  },
  tagName: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    color: "#555",
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
    color: "#888",
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
  },
  placeholderImage: {
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 24,
    color: '#999',
  },
});

export default ExerciseCategoriesScreen;
