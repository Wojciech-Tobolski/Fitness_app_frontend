import apiService from "./ApiService";

/**
 * Klasa do zarządzania treningami
 */
class WorkoutService {
  /**
   * Pobiera ogólne treningi
   * @returns {Promise<Array>} Lista ogólnych treningów
   */
  async getGeneralWorkouts() {
    try {
      console.log("Fetching general workouts...");
      const response = await apiService.get("/workouts/general/");
      console.log("General workouts response:", response);
      return response.data || [];
    } catch (error) {
      console.error("Error fetching general workouts:", error);
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
      }
      return [];
    }
  }

  /**
   * Pobiera treningi personalne
   * @returns {Promise<Array>} Lista treningów personalnych
   */
  async getPersonalWorkouts() {
    try {
      console.log("Fetching personal workouts...");
      const response = await apiService.get("/workouts/personal/");
      console.log("Personal workouts response:", response);
      return response.data || [];
    } catch (error) {
      console.error("Error fetching personal workouts:", error);
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
      }
      return [];
    }
  }

  /**
   * Pobiera dzisiejsze treningi
   * @returns {Promise<Array>} Lista dzisiejszych treningów
   */
  async getTodayWorkouts() {
    try {
      console.log("Fetching today's workouts...");
      const response = await apiService.get("/workouts/personal/today/");
      console.log("Today's workouts response:", response);
      return response.data || [];
    } catch (error) {
      console.error("Error fetching today's workouts:", error);
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
      }
      return [];
    }
  }

  /**
   * Pobiera szczegóły treningu
   * @param {number} workoutId ID treningu
   * @returns {Promise<Object>} Szczegóły treningu
   */
  async getWorkoutDetails(workoutId) {
    try {
      console.log(`[WorkoutService] Fetching workout details for ID: ${workoutId}...`);
      const response = await apiService.get(`/workout/${workoutId}/`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      console.log("[WorkoutService] Workout details response:", response);
      return response.data || {};
    } catch (error) {
      console.error(`[WorkoutService] Get workout details error for ID ${workoutId}:`, error);
      if (error.response) {
        console.error("[WorkoutService] Response status:", error.response.status);
        console.error("[WorkoutService] Response data:", error.response.data);
      }
      if (Platform.OS === 'ios') {
        console.error("[WorkoutService] iOS specific error details:", {
          message: error.message,
          code: error.code,
          response: error.response
        });
      }
      return {};
    }
  }

  /**
   * Pobiera szczegóły przypisanego ćwiczenia
   * @param {number} workoutExerciseId ID przypisanego ćwiczenia
   * @returns {Promise<Object>} Szczegóły przypisanego ćwiczenia
   */
  async getWorkoutExerciseDetails(workoutExerciseId) {
    try {
      console.log(`Fetching workout exercise details for ID: ${workoutExerciseId}...`);
      const response = await apiService.get(`/workoutexercises/${workoutExerciseId}/`);
      console.log("Workout exercise details response:", response);
      return response.data || {};
    } catch (error) {
      console.error(`Error fetching workout exercise details for ID ${workoutExerciseId}:`, error);
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
      }
      return {};
    }
  }

  /**
   * Wysyła feedback dla przypisanego ćwiczenia
   * @param {number} workoutExerciseId ID przypisanego ćwiczenia
   * @param {Object} feedbackData Dane feedbacku (comment, rating)
   * @returns {Promise<Object>} Status operacji
   */
  async submitFeedback(workoutExerciseId, feedbackData) {
    try {
      console.log(`Submitting feedback for workout exercise ID: ${workoutExerciseId}...`);
      console.log("Feedback data:", feedbackData);
      const response = await apiService.post(
        `/workoutexercises/${workoutExerciseId}/feedback/`,
        feedbackData
      );
      console.log("Feedback submission response:", response);
      return response.data || {};
    } catch (error) {
      console.error(`Error submitting feedback for workout exercise ID ${workoutExerciseId}:`, error);
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
      }
      return {};
    }
  }

  /**
   * Pobiera treningi użytkownika (alias dla getPersonalWorkouts)
   * @returns {Promise<Array>} Lista treningów użytkownika
   */
  async getUserWorkouts() {
    try {
      console.log("Fetching user workouts...");
      const response = await this.getPersonalWorkouts();
      console.log("User workouts response:", response);
      return response;
    } catch (error) {
      console.error("Error fetching user workouts:", error);
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
      }
      return [];
    }
  }

  /**
   * Konwertuje względną ścieżkę obrazu na pełny URL
   * @param {string} relativePath Względna ścieżka obrazu
   * @returns {string|null} Pełny URL obrazu
   */
  getFullImageUrl(relativePath) {
    return apiService.getFullMediaUrl(relativePath);
  }
}

// Eksportuj klasę jako singleton
export const workoutService = new WorkoutService();
export default workoutService;
