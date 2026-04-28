import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Pressable } from "@gluestack-ui/themed";
import Feather from "@expo/vector-icons/Feather";

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