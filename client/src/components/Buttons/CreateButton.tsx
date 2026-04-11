import React from "react";
import { Button, ButtonText } from "@gluestack-ui/themed";
import { MotiView } from "moti";
import { Easing } from "react-native-reanimated";

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

const PRESET_STYLES: Record<
	CreateButtonPreset,
	{ backgroundColor: string; borderColor: string; textColor: string; variant?: "outline" }
> = {
	solid: {
		backgroundColor: "#4A90D9",
		borderColor: "#4A90D9",
		textColor: "#F7FBFF",
	},
	outline: {
		backgroundColor: "transparent",
		borderColor: "#A8CFF5",
		textColor: "#2E5F8A",
		variant: "outline",
	},
};

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
