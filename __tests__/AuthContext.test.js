import React from "react";
import { render, act } from "@testing-library/react-native";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { Text, Button } from "react-native";

// Mock SecureStore
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockImplementation(() => Promise.resolve(null)),
  setItemAsync: jest.fn().mockImplementation(() => Promise.resolve()),
  deleteItemAsync: jest.fn().mockImplementation(() => Promise.resolve()),
}));

// Mock API calls
jest.mock("../src/services/api", () => ({
  login: jest
    .fn()
    .mockImplementation(() => Promise.resolve({ token: "test-token" })),
  getCurrentUser: jest
    .fn()
    .mockImplementation(() => Promise.resolve({ id: 1, username: "testuser" })),
}));

// Testowy komponent używający kontekstu autoryzacji
const TestComponent = () => {
  const { userToken, signIn, signOut } = useAuth();

  return (
    <>
      <Text testID="token">{userToken || "no-token"}</Text>
      <Button
        testID="login"
        title="Login"
        onPress={() => signIn("user", "pass")}
      />
      <Button testID="logout" title="Logout" onPress={signOut} />
    </>
  );
};

describe("AuthContext", () => {
  it("powinien zapewniać domyślny stan (brak tokena)", async () => {
    let rendered;

    await act(async () => {
      rendered = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });

    const tokenDisplay = rendered.getByTestId("token");
    expect(tokenDisplay.props.children).toBe("no-token");
  });

  it("powinien aktualizować token po zalogowaniu", async () => {
    let rendered;

    await act(async () => {
      rendered = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });

    const loginButton = rendered.getByTestId("login");

    await act(async () => {
      loginButton.props.onPress();
    });

    const tokenDisplay = rendered.getByTestId("token");
    expect(tokenDisplay.props.children).toBe("test-token");
  });

  it("powinien usuwać token po wylogowaniu", async () => {
    let rendered;

    await act(async () => {
      rendered = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });

    // Najpierw logowanie
    const loginButton = rendered.getByTestId("login");
    await act(async () => {
      loginButton.props.onPress();
    });

    // Potem wylogowanie
    const logoutButton = rendered.getByTestId("logout");
    await act(async () => {
      logoutButton.props.onPress();
    });

    const tokenDisplay = rendered.getByTestId("token");
    expect(tokenDisplay.props.children).toBe("no-token");
  });
});
