import React from "react";
import { PanResponder, Pressable as RNPressable, View } from "react-native";
import { MotiView } from "moti";
import { Box } from "@gluestack-ui/themed";
// Component for a swipe handle button that can be used in modals or bottom sheets to indicate that the user can swipe down to close or reveal additional content. The button features a small horizontal bar that animates up and down to draw attention, and it uses PanResponder to detect swipe gestures. The component accepts props for handling press events, swipe down actions, and disabling the button when necessary.
type SwipeHandleButtonProps = {
	onPress?: () => void;
	onSwipeDown?: () => void;
	disabled?: boolean;
};

export default function SwipeHandleButton({
	onPress,
	onSwipeDown,
	disabled = false,
}: SwipeHandleButtonProps) {
	const hasTriggeredSwipeCloseRef = React.useRef(false);

	const panResponder = React.useMemo(
		() =>
			PanResponder.create({
				onStartShouldSetPanResponder: () => true,
				onStartShouldSetPanResponderCapture: () => true,
				onMoveShouldSetPanResponderCapture: (_, gestureState) => {
					return gestureState.dy > 1 && Math.abs(gestureState.dy) >= Math.abs(gestureState.dx);
				},
				onMoveShouldSetPanResponder: (_, gestureState) => {
					return gestureState.dy > 1 && Math.abs(gestureState.dy) >= Math.abs(gestureState.dx);
				},
				onPanResponderGrant: () => {
					hasTriggeredSwipeCloseRef.current = false;
				},
				onPanResponderMove: (_, gestureState) => {
					if (!onSwipeDown || disabled) {
						return;
					}

					if (!hasTriggeredSwipeCloseRef.current && gestureState.dy > 22) {
						hasTriggeredSwipeCloseRef.current = true;
						onSwipeDown();
					}
				},
				onPanResponderRelease: (_, gestureState) => {
					if (!onSwipeDown || disabled) {
						hasTriggeredSwipeCloseRef.current = false;
						return;
					}

					if (hasTriggeredSwipeCloseRef.current) {
						hasTriggeredSwipeCloseRef.current = false;
						return;
					}

					const movedEnough = gestureState.dy > 20;
					const fastEnough = gestureState.vy > 0.45;
					if (movedEnough || fastEnough) {
						onSwipeDown();
					}

					hasTriggeredSwipeCloseRef.current = false;
				},
				onPanResponderTerminate: () => {
					hasTriggeredSwipeCloseRef.current = false;
				},
				onPanResponderTerminationRequest: () => true,
			}),
		[disabled, onSwipeDown]
	);

	return (
		<View {...panResponder.panHandlers}>
			<MotiView
				from={{ translateY: 0, opacity: 0.85 }}
				animate={{ translateY: 3, opacity: 1 }}
				transition={{
					type: "timing",
					duration: 850,
					loop: true,
					repeatReverse: true,
				}}
			>
				<RNPressable
					onPress={onPress}
					disabled={disabled}
					hitSlop={12}
					style={{ alignItems: "center", paddingVertical: 6 }}
				>
					<Box width={42} height={5} borderRadius={999} bg="#D7D7D7" />
				</RNPressable>
			</MotiView>
		</View>
	);
}
