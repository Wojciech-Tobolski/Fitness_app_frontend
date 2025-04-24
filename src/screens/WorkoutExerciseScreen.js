import React, { useState, useEffect, useRef, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Animated,
  Vibration,
  Platform,
  Linking,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import Slider from "@react-native-community/slider";
import apiService from "../services/ApiService";
import { getBaseUrl, getFullMediaUrl } from "../config/config";
import { WebView } from "react-native-webview";
import { useWindowDimensions } from "react-native";
import { CommonActions } from "@react-navigation/native";

const WorkoutExerciseScreen = ({ route, navigation }) => {
  const { width } = useWindowDimensions();
  const { workoutId, exerciseIndex, exercises, workoutTitle } = route.params;
  const [currentExercise, setCurrentExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restSeconds, setRestSeconds] = useState(0);
  const [rating, setRating] = useState(3); // Domyślna ocena 3/5
  const [feedback, setFeedback] = useState("");
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [sound, setSound] = useState();
  const timerAnimation = useRef(new Animated.Value(0)).current;

  // Nowe stany
  const [showCoachComment, setShowCoachComment] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [question, setQuestion] = useState("");
  const [exerciseNotes, setExerciseNotes] = useState({});
  const [showCongratulationsModal, setShowCongratulationsModal] =
    useState(false);
  const [trainerImage, setTrainerImage] = useState(null);

  // Stany do śledzenia ukończonych serii i feedbacków
  const [completedSets, setCompletedSets] = useState([]);
  const [completedWarmupSets, setCompletedWarmupSets] = useState([]);
  const [allSetsCompleted, setAllSetsCompleted] = useState(false);
  const [allFeedbacks, setAllFeedbacks] = useState(
    route.params.feedbacks || {}
  ); // Przechowuje feedbacki z całego treningu

  // Timer interval ref
  const timerRef = useRef(null);

  useEffect(() => {
    loadExerciseDetails();
    loadTrainerImage();

    // Ustawienie tytułu w nagłówku
    navigation.setOptions({
      title: `${exerciseIndex + 1}/${exercises.length} - ${workoutTitle}`,
      headerLeft: () => (
        <TouchableOpacity
          style={{ marginLeft: 10 }}
          onPress={() => confirmExit()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      ),
    });

    // Czyszczenie przy odmontowaniu
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [exerciseIndex]);

  // Efekt sprawdzający, czy wszystkie serie zostały ukończone
  useEffect(() => {
    if (!currentExercise) return;

    const totalMainSets = currentExercise.main_series || 0;
    if (completedSets.length >= totalMainSets && totalMainSets > 0) {
      setAllSetsCompleted(true);
    } else {
      setAllSetsCompleted(false);
    }
  }, [completedSets, currentExercise]);

  const loadExerciseDetails = async () => {
    try {
      setLoading(true);
      const workoutExerciseId = exercises[exerciseIndex].workoutexercise_id;
      const data = await apiService.get(
        `/workoutexercises/${workoutExerciseId}/`
      );
      console.log("Exercise details:", data);
      setCurrentExercise(data);
    } catch (error) {
      console.error("Error loading exercise details:", error);
      Alert.alert("Błąd", "Nie udało się załadować szczegółów ćwiczenia.");
    } finally {
      setLoading(false);
    }
  };

  const loadTrainerImage = async () => {
    try {
      const response = await apiService.get("/user/current/image/trainer/");
      console.log("Trainer image response:", response);

      // Sprawdzamy różne możliwe formaty odpowiedzi
      if (response) {
        if (response.image_url) {
          setTrainerImage(response.image_url);
        } else if (response.image) {
          setTrainerImage(response.image);
        } else if (response.trainer_image) {
          setTrainerImage(response.trainer_image);
        } else if (typeof response === "string") {
          setTrainerImage(response);
        }
      }
    } catch (error) {
      console.error("Error loading trainer image:", error);
      // Cichy błąd - nie wyświetlamy komunikatu, użyjemy placeholdera
    }
  };

  const confirmExit = () => {
    Alert.alert(
      "Zakończ trening",
      "Czy na pewno chcesz zakończyć trening? Twój postęp nie zostanie zapisany.",
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Zakończ",
          style: "destructive",
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  const startRestTimer = () => {
    // Calculate total rest seconds from rest_min and rest_sec
    const restMinutes = currentExercise.rest_min || 0;
    const restSeconds = currentExercise.rest_sec || 0;
    const totalRestSeconds = restMinutes * 60 + restSeconds;

    // Sprawdź czy czas odpoczynku jest określony
    if (totalRestSeconds <= 0) {
      // If no rest time is defined, use default 60 seconds
      console.log("No rest time defined, using default 60 seconds");
      setRestSeconds(60);
    } else {
      // Ustaw sekundy odpoczynku
      setRestSeconds(totalRestSeconds);
    }

    // Pokaż timer odpoczynku
    setShowRestTimer(true);

    // Resetuj animację i uruchom ją
    timerAnimation.setValue(0);
    Animated.timing(timerAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Uruchom timer
    timerRef.current = setInterval(() => {
      setRestSeconds((prevRestSeconds) => {
        if (prevRestSeconds <= 1) {
          clearInterval(timerRef.current);
          // Odtwórz dźwięk końca timera
          playTimerEndSound();
          // Schowaj timer odpoczynku gdy skończy odliczanie
          setShowRestTimer(false);
          // Wibracja po zakończeniu timera
          Vibration.vibrate(500);
          return 0;
        }
        return prevRestSeconds - 1;
      });
    }, 1000);
  };

  const skipRestTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setShowRestTimer(false);
    timerAnimation.setValue(0);

    // Usunięto automatyczne przejście do następnego ćwiczenia po pominięciu timera
  };

  const playTimerEndSound = async () => {
    try {
      // Próba odtworzenia dźwięku, ale obsłuż potencjalny brak pliku
      try {
        const { sound } = await Audio.Sound.createAsync(
          require("../../assets/sounds/timer-end.mp3")
        );
        setSound(sound);
        await sound.playAsync();
      } catch (soundError) {
        console.log(
          "Plik dźwiękowy nie został znaleziony, używamy tylko wibracji"
        );
        // Użyj dłuższej wibracji jako alternatywy dla dźwięku
        if (Platform.OS !== "web") {
          // Wibracje nie działają na web
          Vibration.vibrate([500, 200, 500]);
        }
      }
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  };

  const showFeedback = () => {
    setShowFeedbackModal(true);
  };

  const submitFeedback = async () => {
    if (!currentExercise) return;

    try {
      const workoutExerciseId = exercises[exerciseIndex].workoutexercise_id;

      // Zapisz feedback do stanu zbiorczego
      const updatedFeedbacks = {
        ...allFeedbacks,
        [workoutExerciseId]: {
          comment: feedback,
          rating: rating,
        },
      };
      setAllFeedbacks(updatedFeedbacks);

      // Jeśli to ostatnie ćwiczenie, wyślij wszystkie feedbacki na backend
      if (exerciseIndex === exercises.length - 1) {
        await sendAllFeedbacks(updatedFeedbacks);
        finishWorkout();
      } else {
        // Przejdź do następnego ćwiczenia
        goToNextExercise(updatedFeedbacks);
      }

      setShowFeedbackModal(false);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      Alert.alert("Błąd", "Nie udało się wysłać opinii. Spróbuj ponownie.");
    }
  };

  const sendAllFeedbacks = async (feedbacks) => {
    try {
      // Wyślij wszystkie feedbacki na backend
      const feedbacksArray = Object.entries(feedbacks).map(
        ([workoutExerciseId, data]) => ({
          workout_exercise_id: workoutExerciseId,
          comment: data.comment,
          rating: data.rating,
        })
      );

      await apiService.post(`/workouts/${workoutId}/feedback/`, {
        feedbacks: feedbacksArray,
      });

      console.log("All feedbacks sent successfully");
    } catch (error) {
      console.error("Error sending all feedbacks:", error);
      Alert.alert(
        "Uwaga",
        "Nie udało się wysłać wszystkich opinii, ale trening został ukończony."
      );
    }
  };

  const skipFeedback = () => {
    setShowFeedbackModal(false);

    if (exerciseIndex === exercises.length - 1) {
      // Jeśli to ostatnie ćwiczenie, kończymy trening
      finishWorkout();
    } else {
      // Przechodzimy do następnego ćwiczenia
      goToNextExercise(allFeedbacks);
    }
  };

  const goToNextExercise = (feedbacks) => {
    // Resetujemy stan ukończonych serii dla nowego ćwiczenia
    setCompletedSets([]);
    setAllSetsCompleted(false);

    // Jeśli to nie ostatnie ćwiczenie, przechodzimy do następnego
    if (exerciseIndex < exercises.length - 1) {
      navigation.replace("WorkoutExercise", {
        workoutId,
        exerciseIndex: exerciseIndex + 1,
        exercises,
        workoutTitle,
        feedbacks: feedbacks, // Przekazujemy zebrane feedbacki
      });
    } else {
      // Jeśli to ostatnie ćwiczenie, pokazujemy formularz feedbacku
      showFeedback();
    }
  };

  const finishWorkout = () => {
    setShowCongratulationsModal(true);

    // Reset nawigacji po zakończeniu treningu
    setTimeout(() => {
      setShowCongratulationsModal(false);

      // Resetujemy nawigację treningu
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Welcome" }],
        })
      );
    }, 3000); // Pokaż ekran gratulacji przez 3 sekundy
  };

  // Formatowanie czasu dla timera
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // Renderuje emoji w zależności od oceny
  const getRatingEmoji = (rating) => {
    if (rating <= 1) return "😩";
    if (rating <= 2) return "😕";
    if (rating <= 3) return "😐";
    if (rating <= 4) return "🙂";
    return "😀";
  };

  const handleQuestionSubmit = async () => {
    if (!question.trim()) {
      Alert.alert("Błąd", "Wprowadź treść pytania");
      return;
    }

    try {
      const workoutExerciseId = exercises[exerciseIndex].workoutexercise_id;
      await apiService.post(
        `/workoutexercises/${workoutExerciseId}/question/`,
        {
          question: question,
        }
      );

      // Dodaj notatkę do lokalnego stanu
      setExerciseNotes({
        ...exerciseNotes,
        [workoutExerciseId]: question,
      });

      Alert.alert("Sukces", "Twoje pytanie zostało wysłane do trenera");
      setQuestion("");
      setShowQuestionModal(false);
    } catch (error) {
      console.error("Error submitting question:", error);
      Alert.alert(
        "Błąd",
        "Nie udało się wysłać pytania. Spróbuj ponownie później."
      );
    }
  };

  const toggleSetCompleted = (setIndex, isWarmup = false) => {
    if (isWarmup) {
      // Handle warmup sets
      if (isWarmupSetCompleted(setIndex)) {
        // Usuń serię z ukończonych jeśli była już oznaczona
        setCompletedWarmupSets((prev) =>
          prev.filter((index) => index !== setIndex)
        );
      } else {
        // Dodaj serię do ukończonych
        setCompletedWarmupSets((prev) => [...prev, setIndex]);

        // Rozpocznij timer odpoczynku po oznaczeniu serii rozgrzewkowej jako ukończonej
        startRestTimer();
      }
    } else {
      // Handle main sets
      if (isSetCompleted(setIndex)) {
        // Usuń serię z ukończonych jeśli była już oznaczona
        setCompletedSets((prev) => prev.filter((index) => index !== setIndex));
      } else {
        // Dodaj serię do ukończonych
        setCompletedSets((prev) => [...prev, setIndex]);

        // Rozpocznij timer odpoczynku po oznaczeniu serii jako ukończonej
        startRestTimer();
      }
    }
  };

  const isSetCompleted = (setIndex) => {
    return completedSets.includes(setIndex);
  };

  const isWarmupSetCompleted = (setIndex) => {
    return completedWarmupSets.includes(setIndex);
  };

  const handleNextExercise = () => {
    if (exerciseIndex === exercises.length - 1) {
      // Jeśli to ostatnie ćwiczenie, pokaż formularz feedbacku
      showFeedback();
    } else {
      // Jeśli nie wszystkie serie są ukończone i mamy serie główne
      const totalMainSets = currentExercise.main_series || 0;
      if (!allSetsCompleted && totalMainSets > 0) {
        Alert.alert(
          "Nieukończone serie",
          "Nie ukończyłeś wszystkich serii. Czy na pewno chcesz przejść dalej?",
          [
            { text: "Anuluj", style: "cancel" },
            { text: "Przejdź dalej", onPress: () => showFeedback() },
          ]
        );
      } else {
        // Wszystkie serie ukończone, pokaż feedback
        showFeedback();
      }
    }
  };

  if (loading || !currentExercise) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Ładowanie ćwiczenia...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Główny ekran ćwiczenia */}
      <ScrollView style={styles.scrollView}>
        <Image
          source={{
            uri: getFullMediaUrl(
              currentExercise.exercise.image || "/media/default/exercise.jpg"
            ),
          }}
          style={styles.exerciseImage}
          resizeMode="cover"
        />

        <View style={styles.content}>
          <Text style={styles.title}>{currentExercise.exercise.title}</Text>

          <View style={styles.seriesContainer}>
            <View style={styles.seriesHeader}>
              <Text style={styles.seriesTitle}>Serie rozgrzewkowe</Text>
              <Text style={styles.seriesCount}>
                {currentExercise.warmup_series} serie
              </Text>
            </View>
            <View style={styles.weightContainer}>
              {currentExercise.warmup &&
                currentExercise.warmup.map((weight, index) => (
                  <TouchableOpacity
                    key={`warmup-${index}`}
                    style={[
                      styles.weightItem,
                      isWarmupSetCompleted(index) && styles.weightItemCompleted,
                    ]}
                    onPress={() => toggleSetCompleted(index, true)}
                  >
                    <Text style={styles.weightNumber}>{index + 1}</Text>
                    <Text style={styles.weightValue}>{weight}</Text>
                    {isWarmupSetCompleted(index) && (
                      <View style={styles.checkmarkContainer}>
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color="#4a90e2"
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}

              {/* Jeśli nie ma zdefiniowanych wag, stwórz puste serie */}
              {(!currentExercise.warmup ||
                currentExercise.warmup.length === 0) &&
                Array.from({ length: currentExercise.warmup_series || 0 }).map(
                  (_, index) => (
                    <TouchableOpacity
                      key={`empty-warmup-${index}`}
                      style={[
                        styles.weightItem,
                        isWarmupSetCompleted(index) &&
                          styles.weightItemCompleted,
                      ]}
                      onPress={() => toggleSetCompleted(index, true)}
                    >
                      <Text style={styles.weightNumber}>{index + 1}</Text>
                      <Text style={styles.weightValue}>-</Text>
                      {isWarmupSetCompleted(index) && (
                        <View style={styles.checkmarkContainer}>
                          <Ionicons
                            name="checkmark-circle"
                            size={16}
                            color="#4a90e2"
                          />
                        </View>
                      )}
                    </TouchableOpacity>
                  )
                )}
            </View>

            <View style={[styles.seriesHeader, styles.mainSeriesHeader]}>
              <Text style={styles.seriesTitle}>Serie główne</Text>
              <Text style={styles.seriesCount}>
                {currentExercise.main_series} serie ×{" "}
                {currentExercise.main_series_reps} powtórzeń
              </Text>
            </View>
            <View style={styles.weightContainer}>
              {currentExercise.main &&
                currentExercise.main.map((weight, index) => (
                  <TouchableOpacity
                    key={`main-${index}`}
                    style={[
                      styles.weightItem,
                      isSetCompleted(index) && styles.weightItemCompleted,
                    ]}
                    onPress={() => toggleSetCompleted(index)}
                  >
                    <Text style={styles.weightNumber}>{index + 1}</Text>
                    <Text style={styles.weightValue}>{weight}</Text>
                    {isSetCompleted(index) && (
                      <View style={styles.checkmarkContainer}>
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color="#4a90e2"
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}

              {/* Jeśli nie ma zdefiniowanych wag, stwórz puste serie */}
              {(!currentExercise.main || currentExercise.main.length === 0) &&
                Array.from({ length: currentExercise.main_series || 0 }).map(
                  (_, index) => (
                    <TouchableOpacity
                      key={`empty-main-${index}`}
                      style={[
                        styles.weightItem,
                        isSetCompleted(index) && styles.weightItemCompleted,
                      ]}
                      onPress={() => toggleSetCompleted(index)}
                    >
                      <Text style={styles.weightNumber}>{index + 1}</Text>
                      <Text style={styles.weightValue}>-</Text>
                      {isSetCompleted(index) && (
                        <View style={styles.checkmarkContainer}>
                          <Ionicons
                            name="checkmark-circle"
                            size={16}
                            color="#4a90e2"
                          />
                        </View>
                      )}
                    </TouchableOpacity>
                  )
                )}
            </View>

            <View style={styles.tempoContainer}>
              <Text style={styles.tempoLabel}>Tempo:</Text>
              <Text style={styles.tempoValue}>
                {currentExercise.tempo || "Normalnie"}
              </Text>
            </View>

            <View style={styles.restContainer}>
              <Text style={styles.restLabel}>Przerwa między seriami:</Text>
              <Text style={styles.restValue}>
                {currentExercise.rest_min || 0}min{" "}
                {currentExercise.rest_sec || 0}s
              </Text>
            </View>

            {currentExercise.comment && (
              <View style={styles.commentContainer}>
                <View style={styles.commentHeader}>
                  <TouchableOpacity
                    onPress={() => setShowCoachComment(!showCoachComment)}
                    style={styles.coachImageContainer}
                  >
                    {trainerImage ? (
                      <Image
                        source={{ uri: getFullMediaUrl(trainerImage) }}
                        style={styles.coachImage}
                      />
                    ) : (
                      <View style={styles.coachImagePlaceholder}>
                        <Ionicons name="person" size={24} color="#fff" />
                      </View>
                    )}
                    {showCoachComment && (
                      <View style={styles.commentBubble}>
                        <Text style={styles.commentValue}>
                          {currentExercise.comment}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <Text style={styles.commentLabel}>Uwagi trenera:</Text>
                </View>
                {!showCoachComment && (
                  <Text style={styles.commentValue}>
                    {currentExercise.comment}
                  </Text>
                )}
              </View>
            )}
          </View>

          <View style={styles.descriptionContainer}>
            <View style={styles.descriptionHeader}>
              <Text style={styles.descriptionTitle}>Opis ćwiczenia</Text>
              <TouchableOpacity
                style={styles.questionButton}
                onPress={() => setShowQuestionModal(true)}
              >
                <Ionicons name="help-circle" size={24} color="#4a90e2" />
                <Text style={styles.questionButtonText}>Pytanie</Text>
              </TouchableOpacity>
            </View>
            {currentExercise.exercise &&
            currentExercise.exercise.html_content &&
            typeof currentExercise.exercise.html_content === "string" ? (
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate("ExerciseDetails", {
                    exerciseId: currentExercise.exercise.id,
                  });
                }}
                style={styles.viewDetailsButton}
              >
                <Text style={styles.descriptionText}>
                  Ćwiczenie posiada pełny opis. Dotknij, aby zobaczyć szczegóły.
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.descriptionText}>
                Brak opisu dla tego ćwiczenia.
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Przycisk do rozpoczęcia następnego ćwiczenia */}
      <TouchableOpacity style={styles.nextButton} onPress={handleNextExercise}>
        <Text style={styles.nextButtonText}>
          {exerciseIndex < exercises.length - 1 ? "Dalej" : "Zakończ ćwiczenie"}
        </Text>
      </TouchableOpacity>

      {/* Modal z timerem przerwy */}
      <Modal visible={showRestTimer} transparent={true} animationType="fade">
        <Animated.View
          style={[
            styles.timerModalContainer,
            {
              opacity: timerAnimation,
              transform: [
                {
                  translateY: timerAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.timerModal}>
            <Text style={styles.timerTitle}>Przerwa</Text>
            <Text style={styles.timerValue}>{formatTime(restSeconds)}</Text>
            <Text style={styles.timerDescription}>
              Odpocznij przed{" "}
              {exerciseIndex < exercises.length - 1
                ? "następną serią"
                : "zakończeniem"}
            </Text>

            <TouchableOpacity style={styles.skipButton} onPress={skipRestTimer}>
              <Text style={styles.skipButtonText}>Pomiń</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Modal>

      {/* Modal z feedbackiem */}
      <Modal
        visible={showFeedbackModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.feedbackModalContainer}>
          <View style={styles.feedbackModal}>
            <Text style={styles.feedbackTitle}>Jak oceniasz to ćwiczenie?</Text>

            <Text style={styles.ratingEmoji}>{getRatingEmoji(rating)}</Text>

            <Slider
              style={styles.ratingSlider}
              minimumValue={1}
              maximumValue={5}
              step={1}
              value={rating}
              onValueChange={setRating}
              minimumTrackTintColor="#4a90e2"
              maximumTrackTintColor="#d3d3d3"
              thumbTintColor="#4a90e2"
            />

            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>Trudne</Text>
              <Text style={styles.sliderLabel}>Łatwe</Text>
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={submitFeedback}
            >
              <Text style={styles.submitButtonText}>Wyślij opinię</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipFeedbackButton}
              onPress={skipFeedback}
            >
              <Text style={styles.skipFeedbackText}>Pomiń</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal z pytaniem do trenera */}
      <Modal
        visible={showQuestionModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.questionModal}>
            <Text style={styles.modalTitle}>Pytanie do trenera</Text>

            <TextInput
              style={styles.questionInput}
              placeholder="Wpisz swoje pytanie lub notatkę"
              multiline={true}
              numberOfLines={4}
              value={question}
              onChangeText={setQuestion}
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleQuestionSubmit}
            >
              <Text style={styles.submitButtonText}>Wyślij</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowQuestionModal(false)}
            >
              <Text style={styles.cancelButtonText}>Anuluj</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal z gratulacjami */}
      <Modal
        visible={showCongratulationsModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.congratulationsContainer}>
          <View style={styles.congratulationsContent}>
            <Ionicons name="trophy" size={80} color="#FFD700" />
            <Text style={styles.congratulationsTitle}>Gratulacje!</Text>
            <Text style={styles.congratulationsText}>
              Ukończyłeś cały trening!
            </Text>
            <Text style={styles.congratulationsSubtext}>
              Za chwilę zostaniesz przekierowany do ekranu głównego
            </Text>
          </View>
        </View>
      </Modal>
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
  },
  scrollView: {
    flex: 1,
  },
  exerciseImage: {
    width: "100%",
    height: 250,
    backgroundColor: "#ddd",
  },
  content: {
    padding: 20,
    paddingBottom: 100, // Space for the button
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  seriesContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  seriesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  mainSeriesHeader: {
    marginTop: 20,
  },
  seriesTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  seriesCount: {
    fontSize: 14,
    color: "#666",
  },
  weightContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  weightItem: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    width: 70,
    padding: 10,
    marginRight: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  weightNumber: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  weightValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  tempoContainer: {
    flexDirection: "row",
    marginTop: 15,
    marginBottom: 5,
  },
  tempoLabel: {
    fontSize: 14,
    color: "#666",
    width: 100,
  },
  tempoValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  restContainer: {
    flexDirection: "row",
    marginBottom: 15,
  },
  restLabel: {
    fontSize: 14,
    color: "#666",
    width: 100,
  },
  restValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  commentContainer: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  commentLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 0,
    marginLeft: 10,
    color: "#444",
  },
  commentValue: {
    fontSize: 14,
    color: "#555",
    fontStyle: "italic",
  },
  coachImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    marginLeft: 0,
    position: "relative",
  },
  coachImage: {
    width: "100%",
    height: "100%",
  },
  coachImagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#4a90e2",
    borderRadius: 20,
  },
  commentBubble: {
    position: "absolute",
    left: 45,
    top: 0,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    width: 250,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
  descriptionContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  descriptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#444",
  },
  nextButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#4a90e2",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  nextButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },

  // Timer Modal Styles
  timerModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  timerModal: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  timerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  timerValue: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#4a90e2",
    marginVertical: 20,
  },
  timerDescription: {
    textAlign: "center",
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  skipButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  skipButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
  },

  // Feedback Modal Styles
  feedbackModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  feedbackModal: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
    textAlign: "center",
  },
  ratingEmoji: {
    fontSize: 48,
    marginBottom: 20,
  },
  ratingSlider: {
    width: "100%",
    height: 40,
  },
  sliderLabels: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  sliderLabel: {
    fontSize: 12,
    color: "#666",
  },
  submitButton: {
    backgroundColor: "#4a90e2",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginBottom: 10,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  skipFeedbackButton: {
    paddingVertical: 10,
  },
  skipFeedbackText: {
    color: "#666",
    fontSize: 14,
  },
  viewDetailsButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#4a90e2",
    borderRadius: 8,
    alignItems: "center",
  },
  questionButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#4a90e2",
    borderRadius: 8,
    alignItems: "center",
  },
  questionButtonText: {
    color: "#4a90e2",
    fontSize: 14,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  questionModal: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
    textAlign: "center",
  },
  questionInput: {
    width: "100%",
    height: 100,
    borderWidth: 1,
    borderColor: "#4a90e2",
    borderRadius: 8,
    padding: 10,
  },
  cancelButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#4a90e2",
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#4a90e2",
    fontSize: 14,
    fontWeight: "bold",
  },
  congratulationsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  congratulationsContent: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  congratulationsTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  congratulationsText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 10,
  },
  congratulationsSubtext: {
    fontSize: 14,
    color: "#666",
  },
  weightItemCompleted: {
    backgroundColor: "#e0e0e0",
  },
  checkmarkContainer: {
    position: "absolute",
    right: 5,
    top: 5,
  },
});

export default WorkoutExerciseScreen;
