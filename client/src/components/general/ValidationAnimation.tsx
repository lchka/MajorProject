import React, { useEffect, useState } from "react";
import { HStack, Text, VStack } from "@gluestack-ui/themed";
import Feather from "@expo/vector-icons/Feather";
import { MotiView } from "moti";
// Component for displaying validation feedback with animated transitions based on the validity of an input value. The component accepts props for the input value, an array of validation rules, colors for valid and invalid states, and options for when to show the feedback and what message to display when valid. It uses the useEffect hook to manage the timing of fade-in animations for valid feedback, and it conditionally renders feedback messages based on the validation results. The component provides a visually engaging way to inform users about the validity of their input in real-time.
export type ValidationRule = {
	id: string;
	label: string;
	test: (value: string) => boolean;
};

type ValidationAnimationProps = {
	value: string;
	rules: ValidationRule[];
	validColor?: string;
	invalidColor?: string;
	showOnlyAfterInputStarts?: boolean;
	validMessage?: string;
};

export default function ValidationAnimation({
	value,
	rules,
	validColor = "#16A34A",
	invalidColor = "#DC2626",
	showOnlyAfterInputStarts = true,
	validMessage = "Looks good",
}: ValidationAnimationProps) {
	const HOLD_BEFORE_FADE_MS = 900;
	const hasStartedInput = value.length > 0;
	const [shouldFadeValid, setShouldFadeValid] = useState(false);

	const firstFailedRule = rules.find((rule) => !rule.test(value));
	const isValid = !firstFailedRule;
	const statusText = isValid ? validMessage : firstFailedRule.label;

	useEffect(() => {
		if (showOnlyAfterInputStarts && !hasStartedInput) {
			setShouldFadeValid(false);
			return;
		}

		if (!isValid) {
			setShouldFadeValid(false);
			return;
		}

		setShouldFadeValid(false);
		const timeoutId = setTimeout(() => {
			setShouldFadeValid(true);
		}, HOLD_BEFORE_FADE_MS);

		return () => clearTimeout(timeoutId);
	}, [hasStartedInput, isValid, showOnlyAfterInputStarts]);

	if (showOnlyAfterInputStarts && !hasStartedInput) {
		return null;
	}

	return (
		<VStack space="xs">
			<MotiView
				key={isValid ? "valid" : "invalid"}
				from={{ opacity: 0, translateY: 4 }}
				animate={
					isValid
						? shouldFadeValid
							? { opacity: 0, translateY: -2 }
							: { opacity: 1, translateY: 0 }
						: { opacity: 1, translateY: 0 }
				}
				transition={{
					type: "timing",
					duration: 240,
				}}
			>
				<HStack alignItems="center" space="sm">
					{isValid ? (
						<Feather name="check-circle" size={16} color={validColor} />
					) : null}
					<Text
						size="xs"
						color={isValid ? validColor : invalidColor}
						style={{ fontFamily: "Roboto" }}
					>
						{statusText}
					</Text>
				</HStack>
			</MotiView>
		</VStack>
	);
}
