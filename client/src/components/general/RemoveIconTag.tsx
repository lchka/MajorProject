import React from "react";
import { Animated, Easing } from "react-native";
import { Image, Pressable } from "@gluestack-ui/themed";
// Component for a removable icon tag that can be used to indicate deletable items in the UI. The component displays an "X" icon that can be pressed to trigger a delete action, and it includes optional props for accessibility labeling, disabled state, size, shaking animation, and positioning. The shaking animation is implemented using the Animated API to create a subtle shake effect when the component is rendered, drawing attention to the delete action. The component also handles disabled states by reducing opacity and preventing interaction when the disabled prop is true.
type RemoveIconTagProps = {
	onDelete: () => void;
	accessibilityLabel?: string;
	disabled?: boolean;
	size?: number;
	shake?: boolean;
	position?: {
		top?: number;
		right?: number;
		bottom?: number;
		left?: number;
	};
};

export default function RemoveIconTag({
	onDelete,
	accessibilityLabel = "Delete item",
	disabled = false,
	size = 24,
	shake = true,
	position = { top: 2, right: 2 },
}: RemoveIconTagProps) {
	const iconSize = Math.max(12, size);
	const shakeValue = React.useRef(new Animated.Value(0)).current;
	const scaleValue = React.useRef(new Animated.Value(1)).current;

	React.useEffect(() => {
		let animation: Animated.CompositeAnimation | null = null;

		if (!shake || disabled) {
			shakeValue.setValue(0);
			scaleValue.setValue(1);
			return;
		}

		const shakeAnimation = Animated.sequence([
			Animated.timing(shakeValue, {
				toValue: -1.2,
				duration: 150,
				easing: Easing.inOut(Easing.quad),
				useNativeDriver: true,
			}),
			Animated.timing(shakeValue, {
				toValue: 1.2,
				duration: 150,
				easing: Easing.inOut(Easing.quad),
				useNativeDriver: true,
			}),
			Animated.timing(shakeValue, {
				toValue: 0,
				duration: 150,
				easing: Easing.inOut(Easing.quad),
				useNativeDriver: true,
			}),
		]);

		const scaleAnimation = Animated.sequence([
			Animated.timing(scaleValue, {
				toValue: 1.02,
				duration: 225,
				easing: Easing.inOut(Easing.quad),
				useNativeDriver: true,
			}),
			Animated.timing(scaleValue, {
				toValue: 1,
				duration: 225,
				easing: Easing.inOut(Easing.quad),
				useNativeDriver: true,
			}),
		]);

		animation = Animated.loop(Animated.parallel([shakeAnimation, scaleAnimation]));
		animation.start();

		return () => {
			animation?.stop();
		};
	}, [shake, disabled, shakeValue, scaleValue]);

	const rotate = shakeValue.interpolate({
		inputRange: [-1.2, 0, 1.2],
		outputRange: ["-2deg", "0deg", "2deg"],
	});

	return (
		<Animated.View
			style={{
				position: "absolute",
				top: position.top,
				right: position.right,
				bottom: position.bottom,
				left: position.left,
				zIndex: 20,
				transform: [{ translateX: shakeValue }, { rotateZ: rotate }, { scale: scaleValue }],
			}}
		>
			<Pressable
				onPress={onDelete}
				disabled={disabled}
				accessibilityLabel={accessibilityLabel}
				hitSlop={8}
				opacity={disabled ? 0.5 : 1}
			>
				<Image
					source={require("../../../assets/xicon.webp")}
					alt="Remove"
					resizeMode="contain"
					style={{ width: iconSize, height: iconSize }}
				/>
			</Pressable>
		</Animated.View>
	);
}
