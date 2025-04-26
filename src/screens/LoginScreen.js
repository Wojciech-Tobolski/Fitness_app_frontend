import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useAuth } from "../context/AuthContext";

const LoginScreen = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { signIn, isLoading, error } = useAuth();

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Błąd", "Proszę wprowadzić nazwę użytkownika i hasło");
      return;
    }

    try {
      const result = await signIn(username, password);
      if (!result.success) {
        Alert.alert(
          "Błąd logowania",
          result.error || "Nieprawidłowe dane logowania"
        );
      }
    } catch (e) {
      Alert.alert(
        "Błąd",
        "Wystąpił nieoczekiwany błąd podczas logowania. Spróbuj ponownie."
      );
      console.error("Login error:", e);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>Fitness App</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Logowanie</Text>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              Aby się zalogować, użyj swoich danych dostępu. Jeśli nie masz
              konta, skontaktuj się z trenerem.
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nazwa użytkownika</Text>
            <TextInput
              style={styles.input}
              placeholder="Wpisz adres email"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Hasło</Text>
            <TextInput
              style={styles.input}
              placeholder="Wpisz hasło"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Zaloguj się</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  appName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4a90e2",
  },
  formContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#333",
  },
  infoContainer: {
    marginBottom: 20,
    backgroundColor: "#f8f9fa",
    padding: 10,
    borderRadius: 5,
    borderLeftWidth: 4,
    borderLeftColor: "#4a90e2",
  },
  infoText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
    fontWeight: "500",
    color: "#555",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
});

export default LoginScreen;
