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
      console.log("[WorkoutService] Fetching general workouts");
      return await apiService.get("/workouts/general/");
    } catch (error) {
      console.error("[WorkoutService] Get general workouts error:", error);
      // Return empty array instead of throwing to prevent black screens
      return [];
    }
  }

  /**
   * Pobiera treningi personalne
   * @returns {Promise<Array>} Lista treningów personalnych
   */
  async getPersonalWorkouts() {
    try {
      console.log("[WorkoutService] Fetching personal workouts");
      return await apiService.get("/workouts/personal/");
    } catch (error) {
      console.error("[WorkoutService] Get personal workouts error:", error);
      // Return empty array instead of throwing to prevent black screens
      return [];
    }
  }

  /**
   * Pobiera dzisiejsze treningi
   * @returns {Promise<Array>} Lista dzisiejszych treningów
   */
  async getTodayWorkouts() {
    try {
      console.log("[WorkoutService] Fetching today workouts");
      return await apiService.get("/workouts/personal/today/");
    } catch (error) {
      console.error("[WorkoutService] Get today workouts error:", error);
      // Return empty array instead of throwing to prevent black screens
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
      console.log(
        `[WorkoutService] Fetching workout details for ID ${workoutId}`
      );
      return await apiService.get(`/workout/${workoutId}/`);
    } catch (error) {
      console.error(
        `[WorkoutService] Get workout details error for ID ${workoutId}:`,
        error
      );
      // Return empty object instead of throwing to prevent black screens
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
      console.log(
        `[WorkoutService] Fetching workout exercise details for ID ${workoutExerciseId}`
      );
      return await apiService.get(`/workoutexercises/${workoutExerciseId}/`);
    } catch (error) {
      console.error(
        `[WorkoutService] Get workout exercise details error for ID ${workoutExerciseId}:`,
        error
      );
      // Return empty object instead of throwing to prevent black screens
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
      console.log(
        `[WorkoutService] Submitting feedback for workout exercise ID ${workoutExerciseId}`
      );
      return await apiService.post(
        `/workoutexercises/${workoutExerciseId}/feedback/`,
        feedbackData
      );
    } catch (error) {
      console.error(
        `[WorkoutService] Submit feedback error for ID ${workoutExerciseId}:`,
        error
      );
      // Return empty object instead of throwing to prevent black screens
      return {};
    }
  }

  /**
   * Pobiera treningi użytkownika (alias dla getPersonalWorkouts)
   * @returns {Promise<Array>} Lista treningów użytkownika
   */
  async getUserWorkouts() {
    try {
      console.log("[WorkoutService] Fetching user workouts");
      return await this.getPersonalWorkouts();
    } catch (error) {
      console.error("[WorkoutService] Get user workouts error:", error);
      throw error;
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
