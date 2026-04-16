import "react-native-reanimated";
import LandingScreen from "./src/screens/general/LandingScreen";
import PreferenceScreen from "./src/screens/PreferenceScreen";
import AllergenScreen from "./src/screens/AllergenScreen";
import ConditionScreen from "./src/screens/Conditions/AddConditionScreen";
import WelcomeScreen from "./src/screens/general/WelcomeScreen";
import LoginScreen from "./src/screens/auth/LoginScreen";
import CreateProfile from "./src/screens/Profile/createProfile";
import EditProfileScreen from "./src/screens/Profile/EditProfile";
import AccountSettings from "./src/screens/general/AccountSettings";
import CameraScreen from "./src/screens/Evaluations/CameraScreen";
import EvaluationResultScreen from "./src/screens/Evaluations/EvaluationResultScreen";
import LoadingScreen from "./src/components/general/loadingScreen";
import HistoryScreen from "./src/screens/Evaluations/HistoryScreen";
import RegisterScreen from "./src/screens/auth/RegisterScreen";
import { GluestackUIProvider } from "@gluestack-ui/themed";
import { config } from "@gluestack-ui/config";
import { StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { enableScreens } from "react-native-screens";
import { AuthStackParamList } from "./src/types/navigation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

// Fonts
import { useFonts, DancingScript_400Regular } from '@expo-google-fonts/dancing-script';
import { Roboto_400Regular, Roboto_500Medium } from '@expo-google-fonts/roboto';

const Stack = createNativeStackNavigator<AuthStackParamList>();
const AUTH_TOKEN_KEY = "authToken";
const PREVIEW_EVALUATION_LOADING = false;

enableScreens(false);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default function App() {
  const [fontsLoaded] = useFonts({
    DancingScript: DancingScript_400Regular,
    Roboto: Roboto_400Regular,
    RobotoMedium: Roboto_500Medium,
  });
  const [authResolved, setAuthResolved] = useState(false);
  const [initialRouteName, setInitialRouteName] = useState<keyof AuthStackParamList>("WelcomeScreen");

  useEffect(() => {
    if (PREVIEW_EVALUATION_LOADING) {
      setInitialRouteName("EvaluationLoading");
      setAuthResolved(true);
      return;
    }

    const resolveAuthState = async () => {
      try {
        const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        setInitialRouteName(token ? "LandingScreen" : "WelcomeScreen");
      } finally {
        setAuthResolved(true);
      }
    };

    void resolveAuthState();
  }, []);

  if (!fontsLoaded || !authResolved) return null;

  return (
    <GluestackUIProvider config={config}>
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaProvider>
          <NavigationContainer>
            <Stack.Navigator
                initialRouteName={initialRouteName}
              screenOptions={{
                headerShown: false,
              }}
            >
              <Stack.Screen name="WelcomeScreen" component={WelcomeScreen} />
              <Stack.Screen name="LandingScreen" component={LandingScreen} />
              <Stack.Screen name="PreferenceScreen" component={PreferenceScreen} />
              <Stack.Screen name="AllergenScreen" component={AllergenScreen} />
              <Stack.Screen name="ConditionScreen" component={ConditionScreen} />
              <Stack.Screen name="LoginScreen" component={LoginScreen} />
              <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
              <Stack.Screen name="ProfileScreen" component={CreateProfile} />
              <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />
              <Stack.Screen name="AccountSettingsScreen" component={AccountSettings} />
              <Stack.Screen name="CameraScreen" component={CameraScreen} />
              <Stack.Screen name="HistoryScreen" component={HistoryScreen} />
              <Stack.Screen name="EvaluationResultScreen" component={EvaluationResultScreen} />
              <Stack.Screen name="EvaluationLoading" component={LoadingScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </GluestackUIProvider>
  );
}