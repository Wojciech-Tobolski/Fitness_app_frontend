import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

// Import screens
import LoginScreen from "../screens/LoginScreen";
import WelcomeScreen from "../screens/WelcomeScreen";
import WorkoutsScreen from "../screens/WorkoutsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ExerciseCategoriesScreen from "../screens/ExerciseCategoriesScreen";
import ExerciseListScreen from "../screens/ExerciseListScreen";
import ExerciseDetailsScreen from "../screens/ExerciseDetailsScreen";
import WorkoutDetailsScreen from "../screens/WorkoutDetailsScreen";
import WorkoutExerciseScreen from "../screens/WorkoutExerciseScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const ExerciseStack = createNativeStackNavigator();
const WorkoutStack = createNativeStackNavigator();

// Stack navigator for Exercise-related screens
const ExerciseNavigator = () => {
  return (
    <ExerciseStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#4a90e2",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
        // Hide back text on iOS, show only arrow
        headerBackTitle: " ",
        headerBackTitleVisible: false,
      }}
    >
      <ExerciseStack.Screen
        name="ExerciseCategories"
        component={ExerciseCategoriesScreen}
        options={{ title: "Kategorie Ćwiczeń" }}
      />
      <ExerciseStack.Screen
        name="ExerciseList"
        component={ExerciseListScreen}
        options={{ title: "Ćwiczenia" }}
      />
      <ExerciseStack.Screen
        name="ExerciseDetails"
        component={ExerciseDetailsScreen}
        options={{ title: "Szczegóły Ćwiczenia" }}
      />
    </ExerciseStack.Navigator>
  );
};

// Stack navigator for Workout-related screens
const WorkoutNavigator = () => {
  return (
    <WorkoutStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#4a90e2",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
        headerBackTitle: " ",
        headerBackTitleVisible: false,
      }}
    >
      <WorkoutStack.Screen
        name="WorkoutsList"
        component={WorkoutsScreen}
        options={{ title: "Treningi" }}
      />
      <WorkoutStack.Screen
        name="WorkoutDetails"
        component={WorkoutDetailsScreen}
        options={{ title: "Szczegóły Treningu" }}
      />
      <WorkoutStack.Screen
        name="WorkoutExercise"
        component={WorkoutExerciseScreen}
        options={{
          title: "Ćwiczenie",
          headerBackVisible: false, // Ukryj domyślny przycisk powrotu
        }}
      />
      <WorkoutStack.Screen
        name="ExerciseDetails"
        component={ExerciseDetailsScreen}
        options={{ title: "Szczegóły Ćwiczenia" }}
      />
    </WorkoutStack.Navigator>
  );
};

// Main app tab navigator (after authentication)
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Welcome") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Workouts") {
            iconName = focused ? "fitness" : "fitness-outline";
          } else if (route.name === "Exercises") {
            iconName = focused ? "barbell" : "barbell-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#4a90e2",
        tabBarInactiveTintColor: "gray",
        headerShown: true,
      })}
    >
      <Tab.Screen
        name="Welcome"
        component={WelcomeScreen}
        options={{ title: "Strona główna" }}
      />
      <Tab.Screen
        name="Workouts"
        component={WorkoutNavigator}
        options={{ headerShown: false, title: "Treningi" }}
      />
      <Tab.Screen
        name="Exercises"
        component={ExerciseNavigator}
        options={{ headerShown: false, title: "Ćwiczenia" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "Profil" }}
      />
    </Tab.Navigator>
  );
};

// Root navigator (handles authentication flow)
const AppNavigator = () => {
  const { userToken, isLoading } = useAuth();

  if (isLoading) {
    // We could show a splash screen here
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {userToken == null ? (
          // User is not logged in - show auth screens
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          // User is logged in - show main app
          <Stack.Screen
            name="Main"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
