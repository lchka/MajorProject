import "react-native-gesture-handler";
import AnalyseScreen from "./src/screens/AnalyseScreen";
import LandingScreen from "./src/screens/LandingScreen";
import WelcomeScreen from "./src/screens/WelcomeScreen";
import LoginScreen from "./src/screens/auth/LoginScreen";
import ProfileScreen from "./src/screens/auth/ProfileScreen";
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

// Fonts
import { useFonts, DancingScript_400Regular } from '@expo-google-fonts/dancing-script';
import { Roboto_400Regular, Roboto_500Medium } from '@expo-google-fonts/roboto';

const Stack = createNativeStackNavigator<AuthStackParamList>();

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

  if (!fontsLoaded) return null;

  return (
    <GluestackUIProvider config={config}>
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaProvider>
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName="WelcomeScreen"
              screenOptions={{
                headerShown: false,
              }}
            >
              <Stack.Screen name="WelcomeScreen" component={WelcomeScreen} />
              <Stack.Screen name="LandingScreen" component={LandingScreen} />
              <Stack.Screen name="LoginScreen" component={LoginScreen} />
              <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
              <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
              <Stack.Screen name="AnalyseScreen" component={AnalyseScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </GluestackUIProvider>
  );
}