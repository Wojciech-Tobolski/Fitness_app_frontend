import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  RefreshControl,
  Alert,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import exerciseService from "../services/ExerciseService";
import { WebView } from "react-native-webview";

const ExerciseDetailsScreen = ({ route, navigation }) => {
  const { exerciseId } = route.params;
  const { signOut } = useAuth();
  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [webViewHeight, setWebViewHeight] = useState(0);

  const fetchExerciseDetails = async () => {
    try {
      setLoading(true);
      console.log(
        `[ExerciseDetailsScreen] Fetching details for exercise ID: ${exerciseId}`
      );
      const data = await exerciseService.getExerciseDetails(exerciseId);

      // Check if we received valid data
      if (!data || Object.keys(data).length === 0) {
        console.log(
          `[ExerciseDetailsScreen] No data received for exercise ID: ${exerciseId}`
        );
        Alert.alert(
          "Błąd ładowania",
          "Nie udało się załadować szczegółów ćwiczenia. Spróbuj ponownie.",
          [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
            },
          ]
        );
        setExercise(null);
      } else {
        setExercise(data);
        // Ustaw tytuł ekranu na nazwę ćwiczenia
        if (data && data.title) {
          navigation.setOptions({
            title: data.title,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching exercise details:", error);

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
      } else {
        Alert.alert(
          "Błąd ładowania",
          "Nie udało się załadować szczegółów ćwiczenia. Spróbuj ponownie.",
          [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
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
    await fetchExerciseDetails();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchExerciseDetails();
  }, [exerciseId, navigation]);

  const openVideo = async (url) => {
    if (await Linking.canOpenURL(url)) {
      await Linking.openURL(url);
    } else {
      console.error("Cannot open URL:", url);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
      </View>
    );
  }

  if (!exercise) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Nie udało się załadować szczegółów ćwiczenia
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Image
        source={{
          uri: exercise.image
            ? exerciseService.getFullImageUrl(exercise.image)
            : "https://via.placeholder.com/350",
        }}
        style={styles.exerciseImage}
      />

      <View style={styles.contentContainer}>
        <Text style={styles.title}>{exercise.title}</Text>

        {exercise.language && (
          <Text style={styles.language}>Język: {exercise.language}</Text>
        )}

        {exercise.tags && exercise.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            <Text style={styles.sectionTitle}>Tagi:</Text>
            <View style={styles.tagsList}>
              {exercise.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag.name}</Text>
                  <Text style={styles.tagCategory}>{tag.category}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {exercise.video_link && (
          <TouchableOpacity
            style={styles.videoButton}
            onPress={() => openVideo(exercise.video_link)}
          >
            <Text style={styles.videoButtonText}>
              Obejrzyj film instruktażowy
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.descriptionContainer}>
          <Text style={styles.sectionTitle}>Opis ćwiczenia:</Text>
          {exercise.html_content ? (
            <WebView
              originWhitelist={["*"]}
              source={{
                html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <style>
                    body {
                      font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                      font-size: 16px;
                      line-height: 1.6;
                      color: #333;
                      margin: 0;
                      padding: 0;
                      background-color: #f5f5f5;
                    }
                    img {
                      max-width: 100%;
                      height: auto;
                      margin-bottom: 10px;
                      border-radius: 8px;
                    }
                    p {
                      margin-bottom: 16px;
                    }
                    h1, h2, h3, h4, h5, h6 {
                      margin-top: 20px;
                      margin-bottom: 10px;
                      color: #222;
                    }
                    ul, ol {
                      margin-bottom: 16px;
                      padding-left: 20px;
                    }
                    li {
                      margin-bottom: 8px;
                    }
                  </style>
                </head>
                <body>
                  ${exercise.html_content}
                </body>
                </html>
                `,
              }}
              style={[styles.webView, { height: webViewHeight || 300 }]}
              scrollEnabled={false}
              javaScriptEnabled={true}
              injectedJavaScript={`
                // Calculate height and resize webview to content
                function updateHeight() {
                  window.ReactNativeWebView.postMessage(
                    JSON.stringify({
                      type: 'contentHeight',
                      height: document.body.scrollHeight
                    })
                  );
                }
                
                // Update on load and on any content change
                window.addEventListener('load', updateHeight);
                updateHeight();
                true;
              `}
              onMessage={(event) => {
                try {
                  const data = JSON.parse(event.nativeEvent.data);
                  if (data.type === "contentHeight") {
                    // Dynamically update webview height
                    setWebViewHeight(data.height);
                  }
                } catch (error) {
                  console.error("WebView message parsing error:", error);
                }
              }}
              onNavigationStateChange={(event) => {
                if (event.url !== "about:blank") {
                  Linking.openURL(event.url);
                  return false;
                }
              }}
            />
          ) : (
            <Text style={styles.noContentText}>
              Brak opisu dla tego ćwiczenia
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
  },
  exerciseImage: {
    width: "100%",
    height: 250,
    backgroundColor: "#ddd",
  },
  contentContainer: {
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  language: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
  },
  tagsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#444",
  },
  tagsList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tag: {
    backgroundColor: "#e0f0ff",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: "#0066cc",
    fontWeight: "500",
  },
  tagCategory: {
    fontSize: 12,
    color: "#666",
  },
  videoButton: {
    backgroundColor: "#4a90e2",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  videoButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  webView: {
    width: "100%",
    backgroundColor: "#f5f5f5",
    marginTop: 10,
    borderWidth: 0,
  },
  noContentText: {
    fontSize: 16,
    color: "#888",
    fontStyle: "italic",
    padding: 10,
  },
});

export default ExerciseDetailsScreen;
