import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Feather from "@expo/vector-icons/Feather";
import { Pressable } from "@gluestack-ui/themed";

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
			alignItems="center"
			justifyContent="center"
			style={style}
			hitSlop={hitSlop}
			accessibilityRole="button"
			accessibilityLabel="Go back"
		>
			<Feather name="chevron-left" size={size} color={color} />
		</Pressable>
	);
}
