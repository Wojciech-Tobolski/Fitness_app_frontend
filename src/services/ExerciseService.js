import apiService from "./ApiService";
import { Platform } from "react-native";

/**
 * Klasa do zarządzania ćwiczeniami
 */
class ExerciseService {
  /**
   * Pobiera kategorie tagów
   * @returns {Promise<Array>} Lista kategorii tagów
   */
  async getTagCategories() {
    try {
      console.log("[ExerciseService] Fetching tag categories...");
      const response = await apiService.get("/tagcategory");
      console.log("[ExerciseService] Tag categories response:", response);
      return response || [];
    } catch (error) {
      console.error("[ExerciseService] Get tag categories error:", error);
      if (error.response) {
        console.error("[ExerciseService] Response status:", error.response.status);
        console.error("[ExerciseService] Response data:", error.response.data);
      }
      if (Platform.OS === 'ios') {
        console.error("[ExerciseService] iOS specific error details:", {
          message: error.message,
          code: error.code,
          response: error.response
        });
      }
      return [];
    }
  }

  /**
   * Pobiera listę ćwiczeń, opcjonalnie filtrowanych po tagID
   * @param {number|null} tagId Opcjonalne ID tagu do filtrowania
   * @returns {Promise<Array>} Lista ćwiczeń
   */
  async getExercises(tagId = null) {
    try {
      console.log(
        `[ExerciseService] Fetching exercises${
          tagId ? ` for tag ${tagId}` : ""
        }`
      );
      
      const endpoint = tagId ? `/exercises/?tag_id=${tagId}` : '/exercises/';
      console.log(`[ExerciseService] Using endpoint: ${endpoint}`);
      
      const response = await apiService.get(endpoint);
      
      console.log("[ExerciseService] Exercises response:", response);
      return response || [];
    } catch (error) {
      console.error("[ExerciseService] Get exercises error:", error);
      if (error.response) {
        console.error("[ExerciseService] Response status:", error.response.status);
        console.error("[ExerciseService] Response data:", error.response.data);
      }
      if (Platform.OS === 'ios') {
        console.error("[ExerciseService] iOS specific error details:", {
          message: error.message,
          code: error.code,
          response: error.response
        });
      }
      return [];
    }
  }

  /**
   * Pobiera szczegóły ćwiczenia
   * @param {number} exerciseId ID ćwiczenia
   * @returns {Promise<Object>} Szczegóły ćwiczenia
   */
  async getExerciseDetails(exerciseId) {
    try {
      console.log(
        `[ExerciseService] Fetching exercise details for ID ${exerciseId}`
      );
      
      const response = await apiService.get(`/exercises/${exerciseId}/`);
      
      console.log(`[ExerciseService] Exercise details response:`, response);
      return response || {};
    } catch (error) {
      console.error(
        `[ExerciseService] Get exercise details error for ID ${exerciseId}:`,
        error
      );
      if (error.response) {
        console.error("[ExerciseService] Response status:", error.response.status);
        console.error("[ExerciseService] Response data:", error.response.data);
      }
      if (Platform.OS === 'ios') {
        console.error("[ExerciseService] iOS specific error details:", {
          message: error.message,
          code: error.code,
          response: error.response
        });
      }
      return {};
    }
  }

  /**
   * Konwertuje względną ścieżkę obrazu na pełny URL
   * @param {string} relativePath Względna ścieżka obrazu
   * @returns {string|null} Pełny URL obrazu
   */
  getFullImageUrl(relativePath) {
    if (!relativePath) return null;
    return apiService.getFullMediaUrl(relativePath);
  }

  async getExercisesByTag(tagId) {
    return this.getExercises(tagId);
  }
}

// Eksportuj klasę jako singleton
export const exerciseService = new ExerciseService();
export default exerciseService;
