import React from "react";
import { Button, ButtonText } from "@gluestack-ui/themed";
import { MotiView } from "moti";
import { Easing } from "react-native-reanimated";
// Component for a customizable "Create" button that can be used in various parts of the app, such as account creation or form submission. The button supports different visual presets (solid or outline), can be disabled, and has an optional pulsing animation to draw attention. The component accepts props for handling press events, customizing the label, and controlling the animation behavior.
type CreateButtonPreset = "solid" | "outline";

type CreateButtonProps = {
	onPress?: () => void;
	label?: string;
	preset?: CreateButtonPreset;
	disabled?: boolean;
	isFullWidth?: boolean;
	isPulsing?: boolean;
	pulseStartDelayMs?: number;
};

const PULSE_SCALE = 1.025;
const PULSE_OPACITY = 0.96;
const PULSE_DURATION_MS = 1400;
// Define preset styles for the CreateButton component, specifying background color, border color, text color, and optional border width and variant for each preset type (solid and outline). These styles are used to ensure consistent visual appearance based on the selected preset.
const PRESET_STYLES: Record<
	CreateButtonPreset,
	{ backgroundColor: string; borderColor: string; textColor: string; borderWidth?: number; variant?: "outline" }
> = {
	solid: {
		backgroundColor: "#4A90D9",
		borderColor: "#4A90D9",
		textColor: "#F7FBFF",
	},
	outline: {
		backgroundColor: "transparent",
		borderColor: "#6FA5DA",
		textColor: "#1F4F80",
		borderWidth: 2,
		variant: "outline",
	},
};
// The CreateButton component uses Moti for animations, allowing it to pulse when the isPulsing prop is true and the button is not disabled. The animation scales the button up slightly and reduces its opacity in a loop, creating a subtle attention-grabbing effect. The button's appearance is determined by the selected preset, and it can be disabled to prevent user interaction while visually indicating that it's inactive.
export default function CreateButton({
	onPress,
	label = "Create my account",
	preset = "solid",
	disabled = false,
	isFullWidth = true,
	isPulsing = true,
	pulseStartDelayMs = 0,
}: CreateButtonProps) {
	const stylePreset = PRESET_STYLES[preset];

	return (
		<MotiView
			from={{ scale: 1, opacity: 1 }}
			animate={{
				scale: isPulsing && !disabled ? PULSE_SCALE : 1,
				opacity: isPulsing && !disabled ? PULSE_OPACITY : 1,
			}}
			transition={{
				type: "timing",
				duration: PULSE_DURATION_MS,
				delay: pulseStartDelayMs,
				loop: isPulsing && !disabled,
				repeatReverse: true,
				easing: Easing.inOut(Easing.ease),
			}}
		>
			<Button
				size="lg"
				variant={stylePreset.variant}
				bg={stylePreset.backgroundColor}
				borderColor={stylePreset.borderColor}
				borderWidth={stylePreset.borderWidth}
				borderRadius="$xl"
				onPress={onPress}
				disabled={disabled}
				w={isFullWidth ? "$full" : undefined}
				opacity={disabled ? 0.5 : 1}
			>
				<ButtonText color={stylePreset.textColor} style={{ fontFamily: "Roboto" }}>
					{label}
				</ButtonText>
			</Button>
		</MotiView>
	);
}
