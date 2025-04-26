import apiService from "./ApiService";

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
      console.log("[ExerciseService] Fetching tag categories");
      return await apiService.get("/tagcategory");
    } catch (error) {
      console.error("[ExerciseService] Get tag categories error:", error);
      // Return empty array instead of throwing to prevent black screens
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
      const params = tagId ? { tag_id: tagId } : {};
      console.log(
        `[ExerciseService] Fetching exercises${
          tagId ? ` for tag ${tagId}` : ""
        }`
      );
      // Use endpoint with trailing slash to avoid Django's 301 redirect
      return await apiService.get(`/exercises?tag_id=${tagId}`);
    } catch (error) {
      console.error("[ExerciseService] Get exercises error:", error);
      // Return empty array instead of throwing to prevent black screens
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
      // Use endpoint with trailing slash to avoid Django's 301 redirect
      return await apiService.get(`/exercises/${exerciseId}/`);
    } catch (error) {
      console.error(
        `[ExerciseService] Get exercise details error for ID ${exerciseId}:`,
        error
      );
      // Return empty object instead of throwing to prevent black screens
      return {};
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

  async getExercisesByTag(tagId) {
    try {
      console.log(`Fetching exercises for tag ID: ${tagId}...`);
      const data = await apiService.get(`/exercises/?tag_id=${tagId}`);
      console.log("Exercises response:", data);
      return data;
    } catch (error) {
      console.error(`Error fetching exercises for tag ID ${tagId}:`, error);
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
      }
      return [];
    }
  }
}

// Eksportuj klasę jako singleton
export const exerciseService = new ExerciseService();
export default exerciseService;
