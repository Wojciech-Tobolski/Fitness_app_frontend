import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import LoginScreen from "../src/screens/LoginScreen";
import { AuthProvider } from "../src/context/AuthContext";

// Mock AuthContext
jest.mock("../src/context/AuthContext", () => {
  const originalModule = jest.requireActual("../src/context/AuthContext");

  return {
    ...originalModule,
    useAuth: () => ({
      signIn: jest
        .fn()
        .mockImplementation(() => Promise.resolve({ success: true })),
      isLoading: false,
      error: null,
    }),
  };
});

// Mock Alert
jest.mock("react-native/Libraries/Alert/Alert", () => ({
  alert: jest.fn(),
}));

// Mock do wyświetlania zdjęcia
jest.mock("../assets/icon.png", () => "test-file-stub");

describe("LoginScreen", () => {
  it("powinien renderować formularz logowania", () => {
    const { getByPlaceholderText, getByText } = render(
      <AuthProvider>
        <LoginScreen />
      </AuthProvider>
    );

    expect(getByPlaceholderText("Wpisz nazwę użytkownika")).toBeTruthy();
    expect(getByPlaceholderText("Wpisz hasło")).toBeTruthy();
    expect(getByText("Zaloguj się")).toBeTruthy();
  });

  it("powinien aktualizować wartości pól formularza", () => {
    const { getByPlaceholderText } = render(
      <AuthProvider>
        <LoginScreen />
      </AuthProvider>
    );

    const usernameInput = getByPlaceholderText("Wpisz nazwę użytkownika");
    const passwordInput = getByPlaceholderText("Wpisz hasło");

    fireEvent.changeText(usernameInput, "testuser");
    fireEvent.changeText(passwordInput, "password123");

    expect(usernameInput.props.value).toBe("testuser");
    expect(passwordInput.props.value).toBe("password123");
  });

  it("powinien wywołać funkcję logowania po kliknięciu przycisku", async () => {
    const { getByPlaceholderText, getByText } = render(
      <AuthProvider>
        <LoginScreen />
      </AuthProvider>
    );

    const usernameInput = getByPlaceholderText("Wpisz nazwę użytkownika");
    const passwordInput = getByPlaceholderText("Wpisz hasło");
    const loginButton = getByText("Zaloguj się");

    fireEvent.changeText(usernameInput, "testuser");
    fireEvent.changeText(passwordInput, "password123");

    await act(async () => {
      fireEvent.press(loginButton);
    });

    // Tutaj możemy sprawdzić czy funkcja logowania została wywołana
    // Zależnie od implementacji funkcji handleLogin
  });
});
