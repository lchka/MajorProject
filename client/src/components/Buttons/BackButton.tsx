import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Pressable, Text } from "@gluestack-ui/themed";

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
  size = 24,
  style,
  hitSlop = 10,
}: BackButtonProps) {
  const navigation = useNavigation();

  const handleBack = React.useCallback(() => {
    if (onPress) {
      onPress();
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation, onPress]);

  return (
    <Pressable
      onPress={handleBack}
      alignSelf="flex-start"
      alignItems="center"
      justifyContent="center"
	  px="$5"
	  py="$3"
      style={style}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <Text
        color={color}
        fontSize={size}
        lineHeight={size}
        fontWeight="300"
      >
        ←
      </Text>
    </Pressable>
  );
}