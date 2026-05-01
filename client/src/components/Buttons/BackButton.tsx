import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Pressable } from "@gluestack-ui/themed";
import Feather from "@expo/vector-icons/Feather";
// Component for a back button that can be used in navigation headers or other parts of the app. The button displays a left arrow icon and can trigger a custom onPress action or navigate back using the navigation stack. The component accepts props for customizing the icon color, size, style, and hit slop for better touch targets.
type BackButtonProps = {
  onPress?: () => void;
  color?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  hitSlop?: number;
};

export default function BackButton({
  onPress,
  color = "#111111",
  size = 28,
  style,
  hitSlop = 10,
}: BackButtonProps) {
  const navigation = useNavigation();
//  Handle the back button press by either calling the provided onPress callback or using the navigation stack to go back if possible. The useCallback hook is used to memoize the handler function, preventing unnecessary re-renders when the component's props or navigation state change.
  const handleBack = React.useCallback(() => {
    if (onPress) return onPress();
    if (navigation.canGoBack()) navigation.goBack();
  }, [navigation, onPress]);

  return (
    <Pressable
      onPress={handleBack}
      alignItems="center"
      justifyContent="center"
      w={44}
      h={44}
      borderRadius={22}
      bg="#daf6ff"
      style={style}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <Feather name="arrow-left" size={size} color={color} />
    </Pressable>
  );
}