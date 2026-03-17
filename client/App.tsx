import AnalyseScreen from "./src/screens/AnalyseScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import { GluestackUIProvider } from "@gluestack-ui/themed";
import { config } from "@gluestack-ui/config";

export default function App() {
  // Switch between screens by commenting/uncommenting:
  return (
    <GluestackUIProvider config={config}>
      <RegisterScreen />
      {/* <AnalyseScreen /> */}
    </GluestackUIProvider>
  );
}
